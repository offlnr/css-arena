export interface Player {
  id: string;
  socketId: string;
  username: string;
  score: number;
  css: string;
  isReady: boolean;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  duration: number;      // seconds
  maxPlayers: number;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  isPublic: boolean;
  status: 'waiting' | 'in_progress' | 'finished';
  players: Map<string, Player>;
  challengeId: string;
  challenge?: ChallengeData;
  createdAt: Date;
  startedAt?: Date;
  timerInterval?: ReturnType<typeof setInterval>;
  timeLeft?: number;
}

// ── Socket.io event payloads ──────────────────────────────────────────────────

export interface CreateRoomPayload {
  username: string;
  roomName: string;
  duration: number;
  maxPlayers: number;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  isPublic: boolean;
}

export interface JoinRoomPayload {
  username: string;
  roomCode: string;
}

export interface CodeUpdatePayload {
  html: string;
  css: string;
}

export interface ChallengeData {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  startHTML: string;
  startCSS: string;
  targetHTML: string;
  targetCSS: string;
}

export interface StartGamePayload {
  roomCode: string;
  challenge?: ChallengeData;
}
