import React, { useState } from 'react';
import { Copy, Users, Globe, Check } from 'lucide-react';
import type { Room } from '../types';
import { useGameStore } from '../stores/gameStore';
import styles from './RoomPage.module.css';

type TabType = 'create' | 'join';
type Difficulty = 'Fácil' | 'Medio' | 'Difícil';

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

interface RoomPageProps {
  onBack: () => void;
  onRoomCreated: (room: Room) => void;
  onRoomJoined: (room: Room) => void;
}

const DURATIONS = [3, 5, 10, 15];
const PLAYER_COUNTS = [2, 4, 6, 8];
const DIFFICULTIES: { key: Difficulty; color: string; desc: string }[] = [
  { key: 'Fácil',   color: '#22C55E', desc: 'Layouts simples, un componente' },
  { key: 'Medio',   color: '#FBBF24', desc: 'Múltiples componentes, colores' },
  { key: 'Difícil', color: '#EF4444', desc: 'Diseños complejos, responsive' },
];

export const RoomPage: React.FC<RoomPageProps> = ({ onBack, onRoomCreated, onRoomJoined }) => {
  const { currentUser } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [roomName, setRoomName]   = useState('Mi sala épica');
  const [roomCode]                = useState(generateRoomCode);
  const [joinCode, setJoinCode]   = useState('');
  const [duration, setDuration]   = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medio');
  const [isPublic, setIsPublic]   = useState(false);
  const [copied, setCopied]       = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildRoom = (code: string, name: string): Room => ({
    id: Math.random().toString(36).slice(2, 11),
    name,
    code: code.toUpperCase(),
    duration,
    maxPlayers,
    difficulty,
    isPublic,
    status: 'waiting',
    createdAt: new Date(),
    players: currentUser ? [currentUser] : [],
  });

  const handleCreate = () => {
    if (!roomName.trim()) return;
    onRoomCreated(buildRoom(roomCode, roomName.trim()));
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    onRoomJoined(buildRoom(code, `Sala ${code}`));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          ← Volver
        </button>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>CSS Arena</span>
        </div>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.main}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'create' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('create')}
          >
            + Crear sala
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'join' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('join')}
          >
            <Users size={14} style={{ display: 'inline', marginRight: 4 }} />
            Unirse a sala
          </button>
        </div>

        <div className={styles.card}>
          {activeTab === 'create' ? (
            <div className={styles.form}>
              {/* Room name */}
              <div className={styles.field}>
                <label className={styles.label}>NOMBRE DE LA SALA</label>
                <input
                  className={styles.input}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Mi sala épica"
                />
              </div>

              {/* Room code */}
              <div className={styles.field}>
                <label className={styles.label}>CÓDIGO DE SALA (COMPARTE CON AMIGOS)</label>
                <div className={styles.codeRow}>
                  <div className={styles.codeDisplay}>
                    <span className={styles.codeHash}>#</span>
                    <span className={styles.codeValue}>{roomCode.split('').join(' ')}</span>
                  </div>
                  <button className={styles.copyButton} onClick={handleCopy}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Duration + Players side by side */}
              <div className={styles.optionsRow}>
                <div className={styles.optionGroup}>
                  <span className={styles.optionLabel}>⏱ DURACIÓN</span>
                  <div className={styles.optionGrid}>
                    {DURATIONS.map((m) => (
                      <button
                        key={m}
                        className={`${styles.optionBtn} ${duration === m ? styles.optionBtnActive : ''}`}
                        onClick={() => setDuration(m)}
                      >
                        {m} min
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.optionGroup}>
                  <span className={styles.optionLabel}>
                    <Users size={11} />
                    &nbsp;JUGADORES
                  </span>
                  <div className={styles.optionGrid}>
                    {PLAYER_COUNTS.map((n) => (
                      <button
                        key={n}
                        className={`${styles.optionBtn} ${maxPlayers === n ? styles.optionBtnActive : ''}`}
                        onClick={() => setMaxPlayers(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div className={styles.field}>
                <label className={styles.label}>DIFICULTAD</label>
                <div className={styles.difficultyList}>
                  {DIFFICULTIES.map(({ key, color, desc }) => (
                    <button
                      key={key}
                      className={`${styles.difficultyRow} ${difficulty === key ? styles.difficultyRowActive : ''}`}
                      onClick={() => setDifficulty(key)}
                    >
                      <span className={styles.difficultyDot} style={{ backgroundColor: color }} />
                      <span className={styles.difficultyName}>{key}</span>
                      <span className={styles.difficultyDesc}>{desc}</span>
                      {difficulty === key && <Check size={13} className={styles.difficultyCheck} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Public toggle */}
              <button
                className={styles.publicRow}
                onClick={() => setIsPublic((v) => !v)}
              >
                <Globe size={16} className={styles.publicIcon} />
                <div className={styles.publicText}>
                  <span className={styles.publicTitle}>Sala pública</span>
                  <span className={styles.publicDesc}>Visible para todos los jugadores</span>
                </div>
                <div className={`${styles.publicRadio} ${isPublic ? styles.publicRadioActive : ''}`} />
              </button>

              {/* Summary */}
              <div className={styles.summary}>
                <span className={styles.summaryLabel}>Resumen:</span>
                {' '}{duration} min · Max {maxPlayers} jugadores ·{' '}
                <span className={styles.summaryDifficulty}>{difficulty}</span>
              </div>

              <button className={styles.createButton} onClick={handleCreate} disabled={!roomName.trim()}>
                {'>'} Crear sala y esperar jugadores
              </button>
            </div>
          ) : (
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>CÓDIGO DE SALA</label>
                <input
                  className={styles.input}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ej: A1B2C3"
                  maxLength={6}
                  style={{ letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, Fira Code, monospace' }}
                />
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#707070', margin: 0 }}>
                Pide el código de sala a quien creó la partida.
              </p>
              <button
                className={styles.createButton}
                onClick={handleJoin}
                disabled={joinCode.trim().length < 4}
              >
                {'>'} Unirse a la sala
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        v0.1.0 — CSS Arena
      </footer>
    </div>
  );
};
