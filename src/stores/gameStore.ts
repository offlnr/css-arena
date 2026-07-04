import { create } from 'zustand';
import type { User, Room, GameState } from '../types';
import type { Challenge } from '../data/challenges';

type RoomPlayer = Pick<User, 'id' | 'username'>;

interface GameStore {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;

  currentRoom: Room | null;
  setCurrentRoom: (room: Room) => void;

  gameState: GameState | null;
  setGameState: (state: GameState) => void;

  pendingChallenge: Challenge | null;
  setPendingChallenge: (c: Challenge | null) => void;

  roomPlayers: RoomPlayer[];
  setRoomPlayers: (players: RoomPlayer[]) => void;

  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  currentRoom: null,
  setCurrentRoom: (room) => set({ currentRoom: room }),

  gameState: null,
  setGameState: (state) => set({ gameState: state }),

  pendingChallenge: null,
  setPendingChallenge: (c) => set({ pendingChallenge: c }),

  roomPlayers: [],
  setRoomPlayers: (players) => set({ roomPlayers: players }),

  reset: () => set({
    currentUser:      null,
    currentRoom:      null,
    gameState:        null,
    pendingChallenge: null,
    roomPlayers:      [],
  }),
}));
