import React, { useState } from 'react';
import { RefreshCw, Code2 } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { CHALLENGES } from '../data/challenges';
import type { GameResult } from '../types';
import styles from './ResultsPage.module.css';

interface ResultsPageProps {
  results: GameResult[];
  onNewGame: () => void;
}

const TROPHY: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function buildDoc(html: string, css: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#f0f2f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}${css}</style></head><body>${html}</body></html>`;
}

function scoreColor(s: number): string {
  return s >= 75 ? '#22C55E' : s >= 40 ? '#FBBF24' : '#EF4444';
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ results, onNewGame }) => {
  const { currentRoom, currentUser, gameState } = useGameStore();
  const challenge = gameState?.challenge ?? CHALLENGES[0];

  const [selectedId, setSelectedId] = useState<string>(currentUser?.id ?? results[0]?.user.id ?? '');
  const [showCode, setShowCode]      = useState(false);
  const [codeTab, setCodeTab]        = useState<'html' | 'css'>('css');

  const selected = results.find((r) => r.user.id === selectedId) ?? results[0];
  const isMe     = selected?.user.id === currentUser?.id;

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onNewGame}>
          ← Inicio
        </button>
        <span className={styles.headerTitle}>Resultados Finales</span>
        {currentRoom && (
          <span className={styles.roomCodeBadge}>SALA-{currentRoom.code}</span>
        )}
        <div className={styles.headerSpacer} />
        <button className={styles.newGameButton} onClick={onNewGame}>
          <RefreshCw size={14} />
          Nueva partida
        </button>
      </header>

      {/* ── Body ── */}
      <div className={styles.body}>
        {/* ── Sidebar: standings ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            🏆 TABLA DE POSICIONES
          </div>
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
                  {TROPHY[r.rank] ?? (
                    <span className={styles.playerRankNum}>{r.rank}</span>
                  )}
                </span>
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>
                    <span className={isMeRow ? styles.playerNameMe : ''}>
                      {isMeRow ? currentUser?.username ?? 'tú' : r.user.username}
                    </span>
                    {isMeRow && <span className={styles.youBadge}>★ tú</span>}
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${r.similarity}%`,
                        backgroundColor: scoreColor(r.similarity),
                      }}
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

        {/* ── Main: comparison ── */}
        <main className={styles.main}>
          {/* Sub-header */}
          <div className={styles.comparisonHeader}>
            <div className={styles.comparingText}>
              Comparando:&nbsp;
              <span className={styles.comparingName}>
                {isMe ? currentUser?.username ?? 'tú' : selected?.user.username}
              </span>
              <span className={styles.comparingScore}>{selected?.similarity ?? 0}% similitud</span>
            </div>
            <button className={styles.codeToggleBtn} onClick={() => setShowCode((v) => !v)}>
              <Code2 size={13} />
              {showCode ? 'Ver preview' : 'Ver código'}
            </button>
          </div>

          {/* Preview vs code toggle */}
          {showCode ? (
            <div className={styles.codeView}>
              <div className={styles.codeTabs}>
                <button
                  className={`${styles.codeTab} ${codeTab === 'html' ? styles.codeTabActive : ''}`}
                  onClick={() => setCodeTab('html')}
                >
                  HTML
                </button>
                <button
                  className={`${styles.codeTab} ${codeTab === 'css' ? styles.codeTabActive : ''}`}
                  onClick={() => setCodeTab('css')}
                >
                  CSS
                </button>
              </div>
              <pre className={styles.codeBlock}>
                {codeTab === 'html' ? challenge.targetHTML : challenge.targetCSS}
              </pre>
            </div>
          ) : (
            <div className={styles.splitView}>
              {/* Target */}
              <div className={styles.splitPane}>
                <div className={`${styles.splitLabel} ${styles.splitLabelTarget}`}>
                  IA OBJETIVO
                </div>
                <iframe
                  srcDoc={buildDoc(challenge.targetHTML, challenge.targetCSS)}
                  sandbox="allow-scripts"
                  className={styles.previewFrame}
                  title="IA objetivo"
                />
              </div>

              {/* Player result — for demo we show the target with varying opacity */}
              <div className={styles.splitPane}>
                <div className={styles.splitLabel}>TU RESULTADO</div>
                <iframe
                  srcDoc={buildDoc(
                    challenge.targetHTML,
                    isMe
                      ? (gameState?.challenge?.targetCSS ?? challenge.targetCSS)
                      : challenge.targetCSS
                  )}
                  sandbox="allow-scripts"
                  className={styles.previewFrame}
                  title="Tu resultado"
                  style={{ opacity: isMe ? 1 : 0.7 + (selected?.similarity ?? 0) / 300 }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
