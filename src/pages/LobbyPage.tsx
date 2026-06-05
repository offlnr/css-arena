import React, { useState } from 'react';
import { Copy, Check, Users } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import styles from './LobbyPage.module.css';

interface LobbyPageProps {
  isHost: boolean;
  onStart: () => void;
  onBack: () => void;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  'Fácil':   '#22C55E',
  'Medio':   '#FBBF24',
  'Difícil': '#EF4444',
};

export const LobbyPage: React.FC<LobbyPageProps> = ({ isHost, onStart, onBack }) => {
  const { currentRoom, currentUser } = useGameStore();
  const [isReady, setIsReady] = useState(false);
  const [copied, setCopied]   = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentRoom?.code ?? '').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canStart = isHost && isReady;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Volver</button>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>CSS Arena</span>
        </div>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.main}>
        {/* Room info card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>{currentRoom?.name ?? 'Sala'}</span>
            <span
              className={styles.difficultyBadge}
              style={{ color: DIFFICULTY_COLOR[currentRoom?.difficulty ?? 'Medio'] }}
            >
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

          {/* Room code */}
          <div className={styles.codeSection}>
            <span className={styles.codeLabel}>CÓDIGO DE SALA</span>
            <div className={styles.codeRow}>
              <span className={styles.codeValue}>
                {currentRoom?.code.split('').join(' ')}
              </span>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className={styles.codeHint}>Comparte este código con tus amigos para que se unan</p>
          </div>
        </div>

        {/* Players */}
        <div className={styles.card}>
          <span className={styles.sectionLabel}>JUGADORES</span>
          <div className={styles.playerList}>
            <div className={styles.playerRow}>
              <div className={styles.playerAvatar}>
                {currentUser?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className={styles.playerName}>
                {currentUser?.username ?? 'tú'}
                {isHost && <span className={styles.hostBadge}>HOST</span>}
              </span>
              <span className={`${styles.readyBadge} ${isReady ? styles.readyBadgeOn : styles.readyBadgeOff}`}>
                {isReady ? '✓ Listo' : 'No listo'}
              </span>
            </div>

            {/* Empty slots */}
            {Array.from({ length: (currentRoom?.maxPlayers ?? 2) - 1 }).map((_, i) => (
              <div key={i} className={`${styles.playerRow} ${styles.playerRowEmpty}`}>
                <div className={`${styles.playerAvatar} ${styles.playerAvatarEmpty}`}>?</div>
                <span className={styles.playerNameEmpty}>Esperando jugador…</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={`${styles.readyBtn} ${isReady ? styles.readyBtnOn : ''}`}
            onClick={() => setIsReady((v) => !v)}
          >
            {isReady ? '✓ Listo' : 'Marcar como listo'}
          </button>

          {isHost && (
            <button
              className={styles.startBtn}
              onClick={onStart}
              disabled={!canStart}
            >
              {canStart ? '▶ Iniciar partida' : 'Esperando que estés listo…'}
            </button>
          )}

          {!isHost && (
            <p className={styles.waitingText}>
              Esperando que el host inicie la partida…
            </p>
          )}
        </div>
      </main>
    </div>
  );
};
