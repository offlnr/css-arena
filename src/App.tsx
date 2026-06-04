import { useState, useCallback } from 'react';
import { IndexPage }   from './pages/IndexPage';
import { RoomPage }    from './pages/RoomPage';
import { ArenaPage }   from './pages/ArenaPage';
import { ResultsPage } from './pages/ResultsPage';
import { useGameStore } from './stores/gameStore';
import type { User, Room, GameResult } from './types';

type AppPage = 'index' | 'room' | 'arena' | 'results';

function App() {
  const [page, setPage] = useState<AppPage>('index');
  const [results, setResults] = useState<GameResult[]>([]);
  const { setCurrentUser, setCurrentRoom, reset } = useGameStore();

  const handleEnterRoom = useCallback((username: string) => {
    const user: User = { id: Math.random().toString(36).slice(2, 11), username };
    setCurrentUser(user);
    setPage('room');
  }, [setCurrentUser]);

  const handleRoomReady = useCallback((room: Room) => {
    setCurrentRoom(room);
    setPage('arena');
  }, [setCurrentRoom]);

  const handleGameEnd = useCallback((gameResults: GameResult[]) => {
    setResults(gameResults);
    setPage('results');
  }, []);

  const handleNewGame = useCallback(() => {
    reset();
    setResults([]);
    setPage('index');
  }, [reset]);

  return (
    <>
      {page === 'index' && (
        <IndexPage
          onCreateRoom={handleEnterRoom}
          onJoinRoom={handleEnterRoom}
        />
      )}

      {page === 'room' && (
        <RoomPage
          onBack={() => setPage('index')}
          onRoomCreated={handleRoomReady}
          onRoomJoined={handleRoomReady}
        />
      )}

      {page === 'arena' && (
        <ArenaPage
          onGameEnd={handleGameEnd}
          onExit={handleNewGame}
        />
      )}

      {page === 'results' && (
        <ResultsPage
          results={results}
          onNewGame={handleNewGame}
        />
      )}
    </>
  );
}

export default App;
