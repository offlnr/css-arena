import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Users, Globe, Check, RefreshCw } from 'lucide-react';
import type { Room } from '../types';
import { useGameStore } from '../stores/gameStore';
import { useI18n } from '../i18n/LanguageContext';
import styles from './RoomPage.module.css';

const SERVER_URL = (import.meta.env.VITE_SERVER_URL as string | undefined) ?? 'http://localhost:3001';

interface PublicRoom {
  code: string;
  name: string;
  players: number;
  maxPlayers: number;
  difficulty: string;
  duration: number; // seconds
}

type TabType = 'create' | 'join';
type Difficulty = 'Fácil' | 'Medio' | 'Difícil';

// These internal difficulty keys stay in Spanish — the server and AI prompt reference them directly.
const DIFFICULTIES: { key: Difficulty; color: string }[] = [
  { key: 'Fácil',   color: '#22C55E' },
  { key: 'Medio',   color: '#FBBF24' },
  { key: 'Difícil', color: '#EF4444' },
];

const DURATIONS     = [3, 5, 10, 15];
const PLAYER_COUNTS = [2, 4, 6, 8];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

interface RoomPageProps {
  onBack: () => void;
  onRoomCreated: (room: Room) => void;
  onRoomJoined: (room: Room) => void;
}

export const RoomPage: React.FC<RoomPageProps> = ({ onBack, onRoomCreated, onRoomJoined }) => {
  const { currentUser } = useGameStore();
  const { t } = useI18n();

  const [activeTab,   setActiveTab]   = useState<TabType>('create');
  const [roomName,    setRoomName]    = useState('Mi sala épica');
  const [roomCode]                    = useState(generateRoomCode);
  const [joinCode,    setJoinCode]    = useState('');
  const [duration,    setDuration]    = useState(5);
  const [maxPlayers,  setMaxPlayers]  = useState(4);
  const [difficulty,  setDifficulty]  = useState<Difficulty>('Medio');
  const [isPublic,    setIsPublic]    = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Maps internal difficulty key to translated display label and description.
  const diffLabel: Record<Difficulty, string> = {
    'Fácil':   t('diff_easy'),
    'Medio':   t('diff_medium'),
    'Difícil': t('diff_hard'),
  };
  const diffDesc: Record<Difficulty, string> = {
    'Fácil':   t('diff_easy_desc'),
    'Medio':   t('diff_medium_desc'),
    'Difícil': t('diff_hard_desc'),
  };

  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res  = await fetch(`${SERVER_URL}/rooms`);
      const data = await res.json() as PublicRoom[];
      setPublicRooms(data);
    } catch {
      setPublicRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'join') fetchRooms();
  }, [activeTab, fetchRooms]);

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
          {t('room_back')}
        </button>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>CSS Arena</span>
        </div>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.main}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'create' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('create')}
          >
            {t('room_tab_create')}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'join' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('join')}
          >
            <Users size={14} style={{ display: 'inline', marginRight: 4 }} />
            {t('room_tab_join')}
          </button>
        </div>

        <div className={styles.card}>
          {activeTab === 'create' ? (
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>{t('room_name_label')}</label>
                <input
                  className={styles.input}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={t('room_name_placeholder')}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{t('room_code_label')}</label>
                <div className={styles.codeRow}>
                  <div className={styles.codeDisplay}>
                    <span className={styles.codeHash}>#</span>
                    <span className={styles.codeValue}>{roomCode.split('').join(' ')}</span>
                  </div>
                  <button className={styles.copyButton} onClick={handleCopy}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? t('room_copied') : t('room_copy')}
                  </button>
                </div>
              </div>

              <div className={styles.optionsRow}>
                <div className={styles.optionGroup}>
                  <span className={styles.optionLabel}>{t('room_duration_label')}</span>
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
                    <Users size={11} />&nbsp;{t('room_players_label')}
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

              <div className={styles.field}>
                <label className={styles.label}>{t('room_difficulty_label')}</label>
                <div className={styles.difficultyList}>
                  {DIFFICULTIES.map(({ key, color }) => (
                    <button
                      key={key}
                      className={`${styles.difficultyRow} ${difficulty === key ? styles.difficultyRowActive : ''}`}
                      onClick={() => setDifficulty(key)}
                    >
                      <span className={styles.difficultyDot} style={{ backgroundColor: color }} />
                      <span className={styles.difficultyName}>{diffLabel[key]}</span>
                      <span className={styles.difficultyDesc}>{diffDesc[key]}</span>
                      {difficulty === key && <Check size={13} className={styles.difficultyCheck} />}
                    </button>
                  ))}
                </div>
              </div>

              <button className={styles.publicRow} onClick={() => setIsPublic((v) => !v)}>
                <Globe size={16} className={styles.publicIcon} />
                <div className={styles.publicText}>
                  <span className={styles.publicTitle}>{t('room_public_title')}</span>
                  <span className={styles.publicDesc}>{t('room_public_desc')}</span>
                </div>
                <div className={`${styles.publicRadio} ${isPublic ? styles.publicRadioActive : ''}`} />
              </button>

              <div className={styles.summary}>
                <span className={styles.summaryLabel}>{t('room_summary')}</span>
                {' '}{duration} {t('room_summary_min')} · {t('room_summary_max')} {maxPlayers} {t('room_summary_players')} ·{' '}
                <span className={styles.summaryDifficulty}>{diffLabel[difficulty]}</span>
              </div>

              <button className={styles.createButton} onClick={handleCreate} disabled={!roomName.trim()}>
                {t('room_create_btn')}
              </button>
            </div>
          ) : (
            <div className={styles.form}>
              <div className={styles.field}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className={styles.label} style={{ margin: 0 }}>{t('room_available_label')}</label>
                  <button
                    onClick={fetchRooms}
                    disabled={loadingRooms}
                    style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
                  >
                    <RefreshCw size={12} style={{ animation: loadingRooms ? 'spin 1s linear infinite' : 'none' }} />
                    {t('room_refresh')}
                  </button>
                </div>

                {loadingRooms ? (
                  <p style={{ color: '#707070', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
                    {t('room_searching')}
                  </p>
                ) : publicRooms.length === 0 ? (
                  <p style={{ color: '#707070', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
                    {t('room_no_rooms')}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {publicRooms.map((r) => (
                      <button
                        key={r.code}
                        onClick={() => setJoinCode(r.code)}
                        style={{
                          background:   joinCode === r.code ? '#1E2030' : '#13151A',
                          border:       `1px solid ${joinCode === r.code ? '#6366F1' : '#2A2D3A'}`,
                          borderRadius: 8,
                          padding:      '10px 14px',
                          cursor:       'pointer',
                          textAlign:    'left',
                          display:      'flex',
                          alignItems:   'center',
                          justifyContent: 'space-between',
                          gap:          8,
                        }}
                      >
                        <div>
                          <div style={{ color: '#E0E0E0', fontWeight: 600, fontSize: '0.9rem' }}>{r.name}</div>
                          <div style={{ color: '#707070', fontSize: '0.78rem', marginTop: 2 }}>
                            {Math.round(r.duration / 60)} min · {r.difficulty}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#A0A0A0', fontSize: '0.8rem' }}>{r.players}/{r.maxPlayers}</span>
                          <Users size={13} color="#A0A0A0" />
                          <span style={{ color: '#6366F1', fontFamily: 'monospace', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                            {r.code}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{t('room_manual_label')}</label>
                <input
                  className={styles.input}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={t('room_manual_placeholder')}
                  maxLength={6}
                  style={{ letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, Fira Code, monospace' }}
                />
              </div>

              <button
                className={styles.createButton}
                onClick={handleJoin}
                disabled={joinCode.trim().length < 4}
              >
                {t('room_join_btn')}
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
