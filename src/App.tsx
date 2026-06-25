import { useState, useCallback } from 'react';
import { IndexPage }   from './pages/IndexPage';
import { RoomPage }    from './pages/RoomPage';
import { LobbyPage }   from './pages/LobbyPage';
import { ArenaPage }   from './pages/ArenaPage';
import { ResultsPage } from './pages/ResultsPage';
import { useGameStore } from './stores/gameStore';
import { LanguageProvider } from './i18n/LanguageContext';
import { LanguageToggle } from './components/LanguageToggle';
import styles from './App.module.css';
import type { User, Room, GameResult } from './types';

type AppPage = 'index' | 'room' | 'lobby' | 'arena' | 'results';

function App() {
  const [page, setPage]       = useState<AppPage>('index');
  const [isHost, setIsHost]   = useState(false);
  const [isRematch, setIsRematch] = useState(false);
  const [results, setResults] = useState<GameResult[]>([]);
  const { setCurrentUser, setCurrentRoom, reset } = useGameStore();

  const handleEnterRoom = useCallback((username: string) => {
    const user: User = { id: Math.random().toString(36).slice(2, 11), username };
    setCurrentUser(user);
    setPage('room');
  }, [setCurrentUser]);

  const handleRoomCreated = useCallback((room: Room) => {
    setCurrentRoom(room);
    setIsHost(true);
    setPage('lobby');
  }, [setCurrentRoom]);

  const handleRoomJoined = useCallback((room: Room) => {
    setCurrentRoom(room);
    setIsHost(false);
    setPage('lobby');
  }, [setCurrentRoom]);

  const handleGameEnd = useCallback((gameResults: GameResult[]) => {
    setResults(gameResults);
    setPage('results');
  }, []);

  const handleNewGame = useCallback(() => {
    reset();
    setResults([]);
    setIsRematch(false);
    setPage('index');
  }, [reset]);

  const handleRematch = useCallback(() => {
    setResults([]);
    setIsRematch(true);
    setPage('lobby');
  }, []);

  return (
    <LanguageProvider>
      <div className={styles.langToggleWrapper}>
        <LanguageToggle />
      </div>
      {page === 'index' && (
        <IndexPage
          onCreateRoom={handleEnterRoom}
          onJoinRoom={handleEnterRoom}
        />
      )}

      {page === 'room' && (
        <RoomPage
          onBack={() => setPage('index')}
          onRoomCreated={handleRoomCreated}
          onRoomJoined={handleRoomJoined}
        />
      )}

      {page === 'lobby' && (
        <LobbyPage
          isHost={isHost}
          isRematch={isRematch}
          onStart={() => { setIsRematch(false); setPage('arena'); }}
          onBack={() => { setIsRematch(false); setPage('room'); }}
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
          isHost={isHost}
          onNewGame={handleNewGame}
          onRematch={handleRematch}
        />
      )}
    </LanguageProvider>
  );
}

export default App;
