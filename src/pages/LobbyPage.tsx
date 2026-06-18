import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Users } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { getSocket, resetSocket } from '../services/socket';
import { generateChallenge } from '../services/challengeGenerator';
import { useI18n } from '../i18n/LanguageContext';
import type { Challenge } from '../data/challenges';
import styles from './LobbyPage.module.css';

interface LobbyPageProps {
  isHost: boolean;
  isRematch?: boolean;
  onStart: () => void;
  onBack: () => void;
}

interface PlayerInfo {
  id: string;
  username: string;
  isMe: boolean;
  isReady: boolean;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  'Fácil':   '#22C55E',
  'Medio':   '#FBBF24',
  'Difícil': '#EF4444',
};

export const LobbyPage: React.FC<LobbyPageProps> = ({ isHost, isRematch, onStart, onBack }) => {
  const { currentRoom, currentUser, setCurrentRoom, setPendingChallenge, setRoomPlayers, roomPlayers } = useGameStore();
  const { t } = useI18n();

  const [isReady,  setIsReady]  = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [players,  setPlayers]  = useState<PlayerInfo[]>([]);
  const [roomCode, setRoomCode] = useState(currentRoom?.code ?? '');
  const [error,    setError]    = useState<string | null>(null);
  const [status,   setStatus]   = useState<'connecting' | 'ready' | 'error'>(isRematch ? 'ready' : 'connecting');
  const [starting, setStarting] = useState(false);

  const startedRef = useRef(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Seed player list from store when returning from results (rematch)
  useEffect(() => {
    if (!isRematch || roomPlayers.length === 0) return;
    const socket = getSocket();
    const myId = socket.id ?? '';
    setPlayers(roomPlayers.map((p) => ({ id: p.id, username: p.username, isMe: p.id === myId, isReady: false })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRematch]);

  useEffect(() => {
    const socket = getSocket();

    const init = () => {
      if (isRematch) {
        // Already in the socket room — skip create/join
        setRoomCode(currentRoom?.code ?? '');
        return;
      }
      if (isHost) {
        socket.emit('create_room', {
          roomName:   currentRoom?.name       ?? 'Sala',
          username:   currentUser?.username   ?? 'Jugador',
          duration:   currentRoom?.duration   ?? 5,
          maxPlayers: currentRoom?.maxPlayers ?? 4,
          difficulty: currentRoom?.difficulty ?? 'Medio',
          isPublic:   currentRoom?.isPublic   ?? false,
        }, (ack: { ok: boolean; roomCode: string }) => {
          if (!ack.ok) { setError('No se pudo crear la sala'); setStatus('error'); return; }
          setRoomCode(ack.roomCode);
          setPlayers([{ id: socket.id!, username: currentUser?.username ?? 'tú', isMe: true, isReady: false }]);
          setStatus('ready');
        });
      } else {
        socket.emit('join_room', {
          roomCode: currentRoom?.code ?? '',
          username: currentUser?.username ?? 'Jugador',
        }, (ack: {
          ok: boolean;
          error?: string;
          roomName?: string;
          duration?: number;
          maxPlayers?: number;
          difficulty?: 'Fácil' | 'Medio' | 'Difícil';
          players?: { id: string; username: string; score: number }[];
        }) => {
          if (!ack.ok) { setError(ack.error ?? 'No se pudo unir a la sala'); setStatus('error'); return; }
          // Sync room settings from host so joined player sees correct data
          if (currentRoom && ack.roomName) {
            setCurrentRoom({
              ...currentRoom,
              name: ack.roomName,
              duration: ack.duration ?? currentRoom.duration,
              maxPlayers: ack.maxPlayers ?? currentRoom.maxPlayers,
              difficulty: ack.difficulty ?? currentRoom.difficulty,
            });
          }
          const list: PlayerInfo[] = (ack.players ?? []).map((p) => ({
            id: p.id, username: p.username, isMe: p.id === socket.id, isReady: false,
          }));
          setPlayers(list);
          setStatus('ready');
        });
      }
    };

    socket.on('connect_error', () => {
      setError('No se pudo conectar al servidor');
      setStatus('error');
    });

    socket.on('player_joined', ({ id, username }: { id: string; username: string }) => {
      setPlayers((prev) => prev.some((p) => p.id === id) ? prev : [...prev, { id, username, isMe: false, isReady: false }]);
    });

    socket.on('player_ready_update', ({ id, isReady }: { id: string; isReady: boolean }) => {
      setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, isReady } : p));
    });

    socket.on('player_left', ({ id }: { id: string }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    });

    socket.on('game_started', ({ challenge }: { challenge?: Challenge }) => {
      if (startedRef.current) return;
      startedRef.current = true;
      if (challenge) setPendingChallenge(challenge);
      setPlayers((current) => {
        setRoomPlayers(current.map((p) => ({ id: p.id, username: p.username })));
        return current;
      });
      onStart();
    });

    if (socket.connected) { init(); } else { socket.once('connect', init); socket.connect(); }

    return () => {
      socket.off('connect', init);
      socket.off('connect_error');
      socket.off('player_joined');
      socket.off('player_ready_update');
      socket.off('player_left');
      socket.off('game_started');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = async () => {
    if (!canStart || starting) return;
    setStarting(true);
    let challenge: Challenge | undefined;
    try { challenge = await generateChallenge(); } catch { /* fallback handled inside */ }
    getSocket().emit('start_game', { roomCode, challenge });
  };

  const handleBack = () => {
    resetSocket();
    onBack();
  };

  const canStart = isHost && isReady;
  const emptySlots = Math.max(0, (currentRoom?.maxPlayers ?? 2) - players.length);

  // ── Connection states ──────────────────────────────────────────────────────
  if (status === 'connecting') {
    return (
      <div className={styles.container}>
        <div className={styles.center}>
          <p className={styles.connectingText}>{t('lobby_connecting')}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.container}>
        <div className={styles.center}>
          <p className={styles.errorTitle}>{t('lobby_connection_error')}</p>
          <p className={styles.errorMsg}>{error}</p>
          <button className={styles.backBtnCenter} onClick={handleBack}>{t('lobby_back')}</button>
        </div>
      </div>
    );
  }

  // ── Lobby ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>{t('lobby_back')}</button>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>CSS Arena</span>
        </div>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.main}>
        {/* Room info */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>{currentRoom?.name ?? 'Sala'}</span>
            <span className={styles.difficultyBadge} style={{ color: DIFFICULTY_COLOR[currentRoom?.difficulty ?? 'Medio'] }}>
              {currentRoom?.difficulty}
            </span>
          </div>

          <div className={styles.meta}>
            <span className={styles.metaItem}>⏱ {currentRoom?.duration} min</span>
            <span className={styles.metaItem}>
              <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
              Max {currentRoom?.maxPlayers}
            </span>
          </div>

          <div className={styles.codeSection}>
            <span className={styles.codeLabel}>{t('lobby_code_label')}</span>
            <div className={styles.codeRow}>
              <span className={styles.codeValue}>{roomCode.split('').join(' ')}</span>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? t('lobby_copied') : t('lobby_copy')}
              </button>
            </div>
            <p className={styles.codeHint}>{t('lobby_code_hint')}</p>
          </div>
        </div>

        {/* Players */}
        <div className={styles.card}>
          <span className={styles.sectionLabel}>{t('lobby_players_label')} ({players.length}/{currentRoom?.maxPlayers ?? 2})</span>
          <div className={styles.playerList}>
            {players.map((p) => (
              <div key={p.id} className={styles.playerRow}>
                <div className={styles.playerAvatar}>{p.username[0]?.toUpperCase()}</div>
                <span className={styles.playerName}>
                  {p.username}
                  {p.isMe && isHost && <span className={styles.hostBadge}>HOST</span>}
                  {p.isMe && !isHost && <span className={styles.meBadge}>{t('lobby_you')}</span>}
                </span>
                <span className={`${styles.readyBadge} ${p.isReady ? styles.readyBadgeOn : styles.readyBadgeOff}`}>
                  {p.isReady ? t('lobby_ready') : t('lobby_not_ready')}
                </span>
              </div>
            ))}

            {Array.from({ length: emptySlots }).map((_, i) => (
              <div key={`empty-${i}`} className={`${styles.playerRow} ${styles.playerRowEmpty}`}>
                <div className={`${styles.playerAvatar} ${styles.playerAvatarEmpty}`}>?</div>
                <span className={styles.playerNameEmpty}>{t('lobby_waiting_player')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={`${styles.readyBtn} ${isReady ? styles.readyBtnOn : ''}`}
            onClick={() => {
              const next = !isReady;
              setIsReady(next);
              setPlayers((prev) => prev.map((p) => p.isMe ? { ...p, isReady: next } : p));
              getSocket().emit('player_ready', { isReady: next });
            }}
          >
            {isReady ? t('lobby_ready') : t('lobby_mark_ready')}
          </button>

          {isHost ? (
            <button className={styles.startBtn} onClick={handleStart} disabled={!canStart}>
              {starting ? t('lobby_generating') : canStart ? t('lobby_start') : t('lobby_waiting_ready')}
            </button>
          ) : (
            <p className={styles.waitingText}>{t('lobby_waiting_host')}</p>
          )}
        </div>
      </main>
    </div>
  );
};
