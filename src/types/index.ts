// Usuario
export interface User {
  id: string;
  username: string;
  avatar?: string;
}

// Sala
export interface Room {
  id: string;
  name: string;
  code: string;
  duration: number; // en minutos
  maxPlayers: number;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  isPublic: boolean;
  status: 'waiting' | 'in_progress' | 'finished';
  createdAt: Date;
  players: User[];
}

// Desafío (HTML/CSS para replicar)
export interface Challenge {
  id: string;
  targetHTML: string;
  targetCSS: string;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  description?: string;
}

// Envío de jugador
export interface PlayerSubmission {
  userId: string;
  roomId: string;
  html: string;
  css: string;
  similarity: number; // 0-100%
  submittedAt: Date;
}

// Resultado
export interface GameResult {
  rank: number;
  user: User;
  similarity: number;
  submittedAt: Date;
  time: number; // segundos
}

// Estado del juego
export interface GameState {
  roomId: string;
  challenge: Challenge;
  players: User[];
  status: 'waiting' | 'in_progress' | 'finished';
  startedAt?: Date;
  endsAt?: Date;
  results?: GameResult[];
}
