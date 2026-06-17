import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { scoreSubmission } from './scorer.js';
import {
  createRoom, getRoom, addPlayer, removePlayer,
  updateScore, getLeaderboard, startGame, finishGame, resetRoom, getAllRooms,
} from './roomManager.js';
import {
  CreateRoomPayload, JoinRoomPayload, CodeUpdatePayload, StartGamePayload,
} from './types.js';

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// List public rooms
app.get('/rooms', (_req, res) => {
  const list = getAllRooms()
    .filter((r) => r.isPublic && r.status === 'waiting')
    .map((r) => ({
      code: r.code,
      name: r.name,
      players: r.players.size,
      maxPlayers: r.maxPlayers,
      difficulty: r.difficulty,
      duration: r.duration,
    }));
  res.json(list);
});

// ── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  // ── create_room ──────────────────────────────────────────────────────────
  socket.on('create_room', (payload: CreateRoomPayload, ack) => {
    const room = createRoom({
      name: payload.roomName,
      hostId: socket.id,
      duration: payload.duration * 60,
      maxPlayers: payload.maxPlayers,
      difficulty: payload.difficulty,
      isPublic: payload.isPublic,
    });

    const player = {
      id: socket.id,
      socketId: socket.id,
      username: payload.username,
      score: 0,
      css: '',
      isReady: false,
    };
    addPlayer(room.code, player);
    socket.join(room.code);
    currentRoomCode = room.code;
    currentPlayerId = socket.id;

    ack?.({ ok: true, roomCode: room.code, roomId: room.id });
  });

  // ── join_room ─────────────────────────────────────────────────────────────
  socket.on('join_room', (payload: JoinRoomPayload, ack) => {
    const room = getRoom(payload.roomCode.toUpperCase());
    if (!room) { ack?.({ ok: false, error: 'Sala no encontrada' }); return; }
    if (room.status !== 'waiting') { ack?.({ ok: false, error: 'La partida ya comenzó' }); return; }
    if (room.players.size >= room.maxPlayers) { ack?.({ ok: false, error: 'Sala llena' }); return; }

    const player = {
      id: socket.id,
      socketId: socket.id,
      username: payload.username,
      score: 0,
      css: '',
      isReady: false,
    };
    addPlayer(room.code, player);
    socket.join(room.code);
    currentRoomCode = room.code;
    currentPlayerId = socket.id;

    // Notify others
    socket.to(room.code).emit('player_joined', { id: socket.id, username: payload.username });
    ack?.({
      ok: true,
      roomCode: room.code,
      roomName: room.name,
      duration: room.duration / 60,
      maxPlayers: room.maxPlayers,
      difficulty: room.difficulty,
      players: getLeaderboard(room.code),
    });
  });

  // ── start_game ────────────────────────────────────────────────────────────
  socket.on('start_game', (payload: StartGamePayload) => {
    const room = getRoom(payload.roomCode);
    if (!room || room.hostId !== socket.id) return;

    if (payload.challenge) room.challenge = payload.challenge;

    startGame(payload.roomCode);
    io.to(payload.roomCode).emit('game_started', {
      challenge: room.challenge,
      duration: room.duration,
    });

    // Server-side countdown broadcast
    let elapsed = 0;
    room.timerInterval = setInterval(() => {
      elapsed++;
      const timeLeft = room.duration - elapsed;
      io.to(payload.roomCode).emit('time_sync', { timeLeft });
      if (timeLeft <= 0) {
        clearInterval(room.timerInterval);
        finishGame(payload.roomCode);
        const results = getLeaderboard(payload.roomCode).map((p, i) => ({
          rank: i + 1,
          ...p,
        }));
        io.to(payload.roomCode).emit('game_ended', { results });
      }
    }, 1000);
  });

  // ── player_ready ─────────────────────────────────────────────────────────
  socket.on('player_ready', (payload: { isReady: boolean }) => {
    if (!currentRoomCode) return;
    const room = getRoom(currentRoomCode);
    const player = room?.players.get(socket.id);
    if (player) {
      player.isReady = payload.isReady;
      io.to(currentRoomCode).emit('player_ready_update', { id: socket.id, isReady: payload.isReady });
    }
  });

  // ── code_update ───────────────────────────────────────────────────────────
  socket.on('code_update', async (payload: CodeUpdatePayload) => {
    if (!currentRoomCode) return;
    const room = getRoom(currentRoomCode);

    // Use server-stored challenge or fall back to target sent by client
    const challenge = room?.challenge ?? payload.target;
    if (!challenge) {
      console.warn('[scorer] no challenge for room', currentRoomCode);
      return;
    }

    // Cache the challenge on the room if it wasn't stored yet
    if (room && !room.challenge && payload.target) {
      room.challenge = { ...payload.target } as typeof room.challenge;
    }

    try {
      const score = await scoreSubmission(
        challenge.targetHTML,
        challenge.targetCSS,
        payload.html,
        payload.css,
      );
      updateScore(currentRoomCode, socket.id, score, payload.css);
      const board = getLeaderboard(currentRoomCode);
      io.to(currentRoomCode).emit('leaderboard_update', { board });
    } catch (err) {
      console.error('[scorer] error:', err);
      // Still broadcast leaderboard so clients don't get stuck on old scores
      const board = getLeaderboard(currentRoomCode);
      io.to(currentRoomCode).emit('leaderboard_update', { board });
    }
  });

  // ── rematch ───────────────────────────────────────────────────────────────
  socket.on('rematch', () => {
    if (!currentRoomCode) return;
    const room = getRoom(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;
    resetRoom(currentRoomCode);
    const players = getLeaderboard(currentRoomCode).map(({ id, username }) => ({ id, username }));
    io.to(currentRoomCode).emit('game_reset', { players });
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    removePlayer(currentRoomCode, currentPlayerId);
    socket.to(currentRoomCode).emit('player_left', { id: currentPlayerId });
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`CSS Arena server running on http://localhost:${PORT}`);
});
