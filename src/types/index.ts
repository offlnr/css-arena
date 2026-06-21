export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  duration: number; // minutes
  maxPlayers: number;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  isPublic: boolean;
  status: 'waiting' | 'in_progress' | 'finished';
  createdAt: Date;
  players: User[];
}

// Difficulty is stored in Spanish because the server and AI prompt use these exact strings.
export interface Challenge {
  id: string;
  targetHTML: string;
  targetCSS: string;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  description?: string;
}

export interface PlayerSubmission {
  userId: string;
  roomId: string;
  html: string;
  css: string;
  similarity: number; // 0–100
  submittedAt: Date;
}

export interface GameResult {
  rank: number;
  user: User;
  similarity: number;
  submittedAt: Date;
  time: number; // seconds elapsed
  css?: string;
}

export interface GameState {
  roomId: string;
  challenge: Challenge;
  players: User[];
  status: 'waiting' | 'in_progress' | 'finished';
  startedAt?: Date;
  endsAt?: Date;
  results?: GameResult[];
}
