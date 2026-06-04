import { create } from 'zustand';
import type { User, Room, GameState } from '../types';

interface GameStore {
  // Usuario actual
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  
  // Sala actual
  currentRoom: Room | null;
  setCurrentRoom: (room: Room) => void;
  
  // Estado del juego
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  
  // Reset
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  currentRoom: null,
  setCurrentRoom: (room) => set({ currentRoom: room }),
  
  gameState: null,
  setGameState: (state) => set({ gameState: state }),
  
  reset: () => set({
    currentUser: null,
    currentRoom: null,
    gameState: null,
  }),
}));
