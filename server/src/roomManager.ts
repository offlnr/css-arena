import { Room, Player } from './types.js';

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

export function createRoom(options: Omit<Room, 'id' | 'code' | 'players' | 'createdAt' | 'status' | 'challengeId'>): Room {
  const code = generateCode();
  const room: Room = {
    ...options,
    id: Math.random().toString(36).slice(2),
    code,
    players: new Map(),
    status: 'waiting',
    challengeId: 'card-profile-1',
    createdAt: new Date(),
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function addPlayer(roomCode: string, player: Player): boolean {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'waiting' || room.players.size >= room.maxPlayers) return false;
  room.players.set(player.id, player);
  return true;
}

export function removePlayer(roomCode: string, playerId: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.players.delete(playerId);
  if (room.players.size === 0) {
    clearInterval(room.timerInterval);
    rooms.delete(roomCode);
  }
}

export function updateScore(roomCode: string, playerId: string, score: number): void {
  const room = rooms.get(roomCode);
  if (!room) return;
  const player = room.players.get(playerId);
  if (player) player.score = score;
}

export function getLeaderboard(roomCode: string): { id: string; username: string; score: number }[] {
  const room = rooms.get(roomCode);
  if (!room) return [];
  return [...room.players.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ id, username, score }) => ({ id, username, score }));
}

export function startGame(roomCode: string): boolean {
  const room = rooms.get(roomCode);
  if (!room || room.status !== 'waiting') return false;
  room.status = 'in_progress';
  room.startedAt = new Date();
  room.timeLeft = room.duration;
  return true;
}

export function finishGame(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.status = 'finished';
  clearInterval(room.timerInterval);
}

export function getAllRooms(): Room[] {
  return [...rooms.values()];
}
