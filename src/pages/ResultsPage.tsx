import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Code2 } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../services/socket';
import { CHALLENGES } from '../data/challenges';
import { useI18n } from '../i18n/LanguageContext';
import type { GameResult } from '../types';
import styles from './ResultsPage.module.css';

interface ResultsPageProps {
  results: GameResult[];
  isHost: boolean;
  onNewGame: () => void;
  onRematch: () => void;
}

const TROPHY: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function buildDoc(html: string, css: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#f0f2f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}${css}</style></head><body>${html}</body></html>`;
}

function scoreColor(s: number): string {
  return s >= 75 ? '#22C55E' : s >= 40 ? '#FBBF24' : '#EF4444';
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ results, isHost, onNewGame, onRematch }) => {
  const { currentRoom, currentUser, gameState, setRoomPlayers } = useGameStore();
  const { t } = useI18n();
  const challenge = gameState?.challenge ?? CHALLENGES[0];

  const [selectedId, setSelectedId] = useState<string>(results[0]?.user.id ?? '');
  const [showCode, setShowCode]      = useState(false);
  const [codeTab, setCodeTab]        = useState<'html' | 'css'>('css');

  // Keep onRematch ref stable so the socket listener never closes over a stale callback.
  const onRematchRef = useRef(onRematch);
  useEffect(() => { onRematchRef.current = onRematch; }, [onRematch]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('game_reset', ({ players }: { players: { id: string; username: string }[] }) => {
      setRoomPlayers(players);
      onRematchRef.current();
    });
    return () => { socket.off('game_reset'); };
  }, [setRoomPlayers]);

  const selected = results.find((r) => r.user.id === selectedId) ?? results[0];
  const isMe     = selected?.user.username === currentUser?.username;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.headerTitle}>{t('results_title')}</span>
        {currentRoom && (
          <span className={styles.roomCodeBadge}>{t('results_room_prefix')}{currentRoom.code}</span>
        )}
        <div className={styles.headerSpacer} />
        {currentRoom && isHost && (
          <button
            className={styles.newGameButton}
            onClick={() => getSocket().emit('rematch')}
          >
            <RefreshCw size={14} />
            {t('results_rematch')}
          </button>
        )}
        <button className={styles.backButton} onClick={onNewGame}>
          {t('results_back')}
        </button>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>{t('results_standings')}</div>

          {results.map((r) => {
            const isActive = r.user.id === selectedId;
            const isMeRow  = r.user.id === currentUser?.id;
            return (
              <div
                key={r.user.id}
                className={[
                  styles.playerCard,
                  isActive ? styles.playerCardActive : '',
                  isMeRow  ? styles.playerCardMe    : '',
                ].join(' ')}
                onClick={() => setSelectedId(r.user.id)}
              >
                <span className={styles.playerTrophy}>
                  {TROPHY[r.rank] ?? <span className={styles.playerRankNum}>{r.rank}</span>}
                </span>
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>
                    <span className={isMeRow ? styles.playerNameMe : ''}>
                      {isMeRow ? currentUser?.username ?? t('arena_you') : r.user.username}
                    </span>
                    {isMeRow && <span className={styles.youBadge}>{t('results_you_badge')}</span>}
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${r.similarity}%`, backgroundColor: scoreColor(r.similarity) }}
                    />
                  </div>
                </div>
                <span className={styles.playerScore} style={{ color: scoreColor(r.similarity) }}>
                  {r.similarity}%
                </span>
              </div>
            );
          })}
        </aside>

        <main className={styles.main}>
          <div className={styles.comparisonHeader}>
            <div className={styles.comparingText}>
              {t('results_comparing')}&nbsp;
              <span className={styles.comparingName}>
                {isMe ? currentUser?.username ?? t('arena_you') : selected?.user.username}
              </span>
              <span className={styles.comparingScore}>
                {selected?.similarity ?? 0}{t('results_similarity')}
              </span>
            </div>
            <button className={styles.codeToggleBtn} onClick={() => setShowCode((v) => !v)}>
              <Code2 size={13} />
              {showCode ? t('results_view_preview') : t('results_view_code')}
            </button>
          </div>

          {showCode ? (
            <div className={styles.codeView}>
              <div className={styles.codeTabs}>
                <button
                  className={`${styles.codeTab} ${codeTab === 'html' ? styles.codeTabActive : ''}`}
                  onClick={() => setCodeTab('html')}
                >HTML</button>
                <button
                  className={`${styles.codeTab} ${codeTab === 'css' ? styles.codeTabActive : ''}`}
                  onClick={() => setCodeTab('css')}
                >CSS</button>
              </div>
              <pre className={styles.codeBlock}>
                {codeTab === 'html' ? challenge.targetHTML : (selected?.css || t('results_no_css'))}
              </pre>
            </div>
          ) : (
            <div className={styles.splitView}>
              <div className={styles.splitPane}>
                <div className={`${styles.splitLabel} ${styles.splitLabelTarget}`}>
                  {t('results_ai_objective')}
                </div>
                <iframe
                  srcDoc={buildDoc(challenge.targetHTML, challenge.targetCSS)}
                  sandbox="allow-scripts"
                  className={styles.previewFrame}
                  title="AI objective"
                />
              </div>

              <div className={styles.splitPane}>
                <div className={styles.splitLabel}>
                  {isMe
                    ? t('results_your_result')
                    : `${t('results_result_of')} ${selected?.user.username.toUpperCase()}`}
                </div>
                <iframe
                  srcDoc={buildDoc(challenge.targetHTML, selected?.css ?? '')}
                  sandbox="allow-scripts"
                  className={styles.previewFrame}
                  title="Player result"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
