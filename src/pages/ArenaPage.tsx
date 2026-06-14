import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { LogOut, BarChart2 } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { generateChallenge } from '../services/challengeGenerator';
import { getSocket } from '../services/socket';
import { registerCssCompletions } from '../data/cssCompletions';
import type { Challenge } from '../data/challenges';
import type { GameResult } from '../types';
import styles from './ArenaPage.module.css';

interface ArenaPageProps {
  onGameEnd: (results: GameResult[]) => void;
  onExit: () => void;
}

type CodeTab = 'html' | 'css';

interface Player {
  id: string;
  username: string;
  score: number;
  isMe: boolean;
}

function buildDoc(html: string, css: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><script>document.addEventListener('click',function(e){var el=e.target;while(el){if(el.tagName==='A'||el.tagName==='BUTTON'){e.preventDefault();e.stopPropagation();return;}el=el.parentElement;}},true);<\/script><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#f0f2f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}${css}</style></head><body>${html}</body></html>`;
}

function calcScore(userCSS: string, targetCSS: string): number {
  if (!userCSS.trim()) return 0;
  const propRe = /([\w-]+)\s*:\s*([^;{}\n]+)/g;
  const extract = (css: string) => {
    const m = new Map<string, string>();
    let match;
    while ((match = propRe.exec(css)) !== null) {
      m.set(match[1].trim().toLowerCase(), match[2].trim().toLowerCase());
    }
    propRe.lastIndex = 0;
    return m;
  };
  const target = extract(targetCSS);
  const user   = extract(userCSS);
  if (target.size === 0) return 0;
  let hits = 0;
  target.forEach((val, key) => {
    if (user.has(key)) hits += user.get(key) === val ? 1 : 0.4;
  });
  return Math.min(Math.round((hits / target.size) * 100), 100);
}

export const ArenaPage: React.FC<ArenaPageProps> = ({ onGameEnd, onExit }) => {
  const { currentRoom, currentUser, setGameState, pendingChallenge, setPendingChallenge, roomPlayers } = useGameStore();

  // ── Challenge loading state ─────────────────────────────────────────────
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (pendingChallenge) {
      setChallenge(pendingChallenge);
      setPendingChallenge(null);
      setLoadStatus('ready');
      return;
    }
    let cancelled = false;
    setLoadStatus('loading');
    generateChallenge()
      .then((c) => { if (!cancelled) { setChallenge(c); setLoadStatus('ready'); } })
      .catch(() => { if (!cancelled) setLoadStatus('error'); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    setLoadStatus('loading');
    generateChallenge()
      .then((c) => { setChallenge(c); setLoadStatus('ready'); })
      .catch(() => setLoadStatus('error'));
  };

  // ── Game state (only active after challenge is ready) ───────────────────
  const [activeTab, setActiveTab] = useState<CodeTab>('html');
  const [htmlCode, setHtmlCode]   = useState('');
  const [cssCode,  setCssCode]    = useState('');
  const [timeLeft, setTimeLeft]   = useState((currentRoom?.duration ?? 5) * 60);
  const [players, setPlayers]     = useState<Player[]>([]);

  // Populate editor + players once challenge loads
  useEffect(() => {
    if (!challenge) return;
    setHtmlCode(challenge.startHTML);
    setCssCode(challenge.startCSS);

    const socket = getSocket();
    const myId = socket.id ?? currentUser?.id ?? 'me';
    const initial = roomPlayers.length > 0
      ? roomPlayers.map((p) => ({ id: p.id, username: p.username, score: 0, isMe: p.id === myId }))
      : [{ id: myId, username: currentUser?.username ?? 'tú', score: 0, isMe: true }];
    setPlayers(initial);
  }, [challenge, currentUser, roomPlayers]);

  // Sync leaderboard via socket
  useEffect(() => {
    if (loadStatus !== 'ready') return;
    const socket = getSocket();

    socket.on('leaderboard_update', ({ board }: { board: { id: string; username: string; score: number }[] }) => {
      const myId = socket.id ?? currentUser?.id ?? 'me';
      setPlayers(board.map((p) => ({ id: p.id, username: p.username, score: p.score, isMe: p.id === myId })));
    });

    // Use server timer as source of truth so all clients stay in sync
    socket.on('time_sync', ({ timeLeft: serverTime }: { timeLeft: number }) => {
      setTimeLeft(serverTime);
    });

    return () => {
      socket.off('leaderboard_update');
      socket.off('time_sync');
    };
  }, [loadStatus, currentUser]);

  const resultRef   = useRef<HTMLIFrameElement>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const playersRef  = useRef<Player[]>([]);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => { playersRef.current  = players;  }, [players]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // Actualizar iframe con document.write — confiable en todos los navegadores
  useEffect(() => {
    if (!challenge) return;
    const iframe = resultRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(buildDoc(htmlCode, cssCode));
    doc.close();

    const score = calcScore(cssCode, challenge.targetCSS);
    setPlayers((prev) => prev.map((p) => (p.isMe ? { ...p, score } : p)));
    getSocket().emit('code_update', { score });
  }, [htmlCode, cssCode, challenge]);

  // handleEnd sin timeLeft ni players en deps — usa refs para evitar reinicios del timer
  const handleEnd = useCallback(() => {
    clearInterval(timerRef.current!);

    const current = playersRef.current;
    const elapsed = (currentRoom?.duration ?? 5) * 60 - timeLeftRef.current;
    const sorted  = [...current].sort((a, b) => b.score - a.score);
    const results: GameResult[] = sorted.map((p, i) => ({
      rank: i + 1,
      user: { id: p.id, username: p.isMe ? (currentUser?.username ?? 'tú') : p.username },
      similarity: Math.round(p.score),
      submittedAt: new Date(),
      time: elapsed,
    }));

    setGameState({
      roomId: currentRoom?.id ?? '',
      challenge: {
        id: challenge?.id ?? '',
        targetHTML: challenge?.targetHTML ?? '',
        targetCSS: challenge?.targetCSS ?? '',
        difficulty: challenge?.difficulty ?? 'Fácil',
      },
      players: sorted.map((p) => ({ id: p.id, username: p.username })),
      status: 'finished',
      results,
    });

    onGameEnd(results);
  }, [currentRoom, currentUser, challenge, setGameState, onGameEnd]);
  // ↑ sin timeLeft ni players — estable durante toda la partida

  // Timer — solo arranca cuando el desafío está listo
  useEffect(() => {
    if (loadStatus !== 'ready') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [loadStatus]);

  // Disparar handleEnd cuando el timer llega a 0
  const hasEndedRef = useRef(false);
  useEffect(() => {
    if (timeLeft === 0 && loadStatus === 'ready' && !hasEndedRef.current) {
      hasEndedRef.current = true;
      handleEnd();
    }
  }, [timeLeft, loadStatus, handleEnd]);


  // ── Helpers ─────────────────────────────────────────────────────────────
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const myScore = players.find((p) => p.isMe)?.score ?? 0;
  const lineCount = (activeTab === 'html' ? htmlCode : cssCode).split('\n').length;

  const rankClass = (i: number) =>
    i === 0 ? styles.playerRankGold : i === 1 ? styles.playerRankSilver : i === 2 ? styles.playerRankBronze : '';

  const scoreColor = (s: number) =>
    s >= 75 ? '#22C55E' : s >= 40 ? '#FBBF24' : '#EF4444';

  // ── Loading screen ───────────────────────────────────────────────────────
  if (loadStatus === 'loading') {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingIcon}>&gt;_</div>
        <div>
          <p className={styles.loadingTitle}>Generando desafío con IA…</p>
          <p className={styles.loadingSubtitle}>La IA está creando un reto único para esta partida</p>
        </div>
        <div className={styles.loadingDots}>
          <span /><span /><span />
        </div>
      </div>
    );
  }

  if (loadStatus === 'error') {
    return (
      <div className={styles.errorScreen}>
        <p className={styles.errorTitle}>No se pudo generar el desafío</p>
        <p className={styles.errorMsg}>
          Revisa tu conexión o configura VITE_GEMINI_API_KEY en el archivo .env
        </p>
        <button className={styles.errorBtn} onClick={retry}>Reintentar</button>
        <button className={styles.errorBtn} style={{ background: 'none', border: '1px solid #3A4048', color: '#A0A0A0' }} onClick={onExit}>Volver</button>
      </div>
    );
  }

  // ── Arena ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>CSS Arena</span>
          </div>
          <div className={styles.roomCode}>
            # {currentRoom?.code ?? 'DEMO'}
          </div>
        </div>

        <div className={styles.timer}>
          <span className={styles.timerIcon}>⏱</span>
          <span className={`${styles.timerText} ${timeLeft < 60 ? styles.timerWarning : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.headerBtn} onClick={handleEnd}>
            <BarChart2 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Resultados
          </button>
          <button className={styles.headerBtn} onClick={onExit}>
            <LogOut size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Salir
          </button>
        </div>
      </header>

      {/* 3-column layout */}
      <div className={styles.layout}>
        {/* Editor */}
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <div className={styles.editorTabs}>
              <button
                className={`${styles.editorTab} ${activeTab === 'html' ? styles.editorTabActive : ''}`}
                onClick={() => setActiveTab('html')}
              >HTML</button>
              <button
                className={`${styles.editorTab} ${activeTab === 'css' ? styles.editorTabActive : ''}`}
                onClick={() => setActiveTab('css')}
              >CSS</button>
            </div>
            <span className={styles.lineCount}>{lineCount} Líneas</span>
          </div>

          <div className={styles.editorWrapper}>
            <Editor
              key={activeTab}
              language={activeTab}
              value={activeTab === 'html' ? htmlCode : cssCode}
              onChange={(val) =>
                activeTab === 'html' ? setHtmlCode(val ?? '') : setCssCode(val ?? '')
              }
              theme="vs-dark"
              beforeMount={(monaco) => {
                // Registrar completado CSS en el hilo principal
                // Funciona sin workers, instantáneo, sin depender del CDN
                if (activeTab === 'css') {
                  registerCssCompletions(monaco)
                }
              }}
              onMount={(editor) => {
                // Forzar sugerencias en cada cambio de texto.
                // Necesario cuando los workers del CDN tardan en cargar o están bloqueados.
                editor.onDidChangeModelContent(() => {
                  const pos   = editor.getPosition()
                  const model = editor.getModel()
                  if (!pos || !model) return
                  const word = model.getWordUntilPosition(pos)
                  if (word.word.length > 0) {
                    editor.trigger('keyboard', 'editor.action.triggerSuggest', {})
                  }
                })
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 8, bottom: 8 },
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                automaticLayout: true,
                quickSuggestions: true,
                quickSuggestionsDelay: 0,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                tabCompletion: 'on',
                wordBasedSuggestions: 'off',
                hover: { enabled: true },
                formatOnPaste: true,
              }}
            />
          </div>
        </div>

        {/* Previews */}
        <div className={styles.previewPanel}>
          <div className={`${styles.previewSection} ${styles.previewSectionTarget}`}>
            <div className={styles.previewHeader}>
              <span className={styles.previewDot} style={{ background: '#6366F1' }} />
              OBJETIVO DE LA IA
            </div>
            <div className={styles.previewContent}>
              <iframe
                srcDoc={buildDoc(challenge!.targetHTML, challenge!.targetCSS)}
                sandbox="allow-scripts"
                className={styles.previewIframe}
                title="Objetivo IA"
              />
            </div>
          </div>

          <div className={`${styles.previewSection} ${styles.previewSectionResult}`}>
            <div className={styles.previewHeader}>
              <span className={`${styles.previewDot} ${styles.previewDotLive}`} style={{ background: '#00FF88' }} />
              TU RESULTADO
              <span className={styles.previewHeaderSpacer} />
              <span
                className={styles.previewScorePill}
                style={{ color: scoreColor(myScore), borderColor: scoreColor(myScore) }}
              >
                {Math.round(myScore)}%
              </span>
            </div>
            <div className={styles.previewProgressBar}>
              <div
                className={styles.previewProgressFill}
                style={{ width: `${myScore}%`, background: scoreColor(myScore) }}
              />
            </div>
            <div className={styles.previewContent}>
              <iframe
                ref={resultRef}
                sandbox="allow-scripts allow-same-origin"
                className={styles.previewIframe}
                title="Tu resultado"
              />
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className={styles.leaderboard}>
          <div className={styles.leaderboardHeader}>
            <span className={styles.leaderboardIcon}>🏆</span>
            CLASIFICACIÓN
          </div>
          <div className={styles.playerList}>
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className={`${styles.playerRow} ${p.isMe ? styles.playerRowMe : ''}`}>
                <span className={`${styles.playerRank} ${rankClass(i)}`}>{i + 1}</span>
                <span className={`${styles.playerName} ${p.isMe ? styles.playerNameMe : ''}`}>
                  {p.isMe ? `tú (${currentUser?.username ?? 'tú'})` : p.username}
                </span>
                <span className={styles.playerScore} style={{ color: scoreColor(p.score) }}>
                  {Math.round(p.score)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
