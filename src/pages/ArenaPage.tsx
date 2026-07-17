import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { LogOut } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { generateChallenge } from '../services/challengeGenerator';
import { getSocket } from '../services/socket';
import { registerCssCompletions } from '../data/cssCompletions';
import { calcVisualScore } from '../utils/visualScore';
import { useI18n } from '../i18n/LanguageContext';
import type { Challenge } from '../data/challenges';
import type { GameResult } from '../types';
import styles from './ArenaPage.module.css';

interface ArenaPageProps {
  onGameEnd: (results: GameResult[]) => void;
  onExit: () => void;
}

const SCORING_DEBOUNCE_MS = 800;

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

export const ArenaPage: React.FC<ArenaPageProps> = ({ onGameEnd, onExit }) => {
  const { currentRoom, currentUser, setGameState, pendingChallenge, setPendingChallenge, roomPlayers } = useGameStore();
  const { t } = useI18n();

  const [challenge,   setChallenge]   = useState<Challenge | null>(null);
  const [loadStatus,  setLoadStatus]  = useState<'loading' | 'ready' | 'error'>('loading');
  const [activeTab,   setActiveTab]   = useState<CodeTab>('html');
  const [htmlCode,    setHtmlCode]    = useState('');
  const [cssCode,     setCssCode]     = useState('');
  const [timeLeft,    setTimeLeft]    = useState((currentRoom?.duration ?? 5) * 60);
  const [players,     setPlayers]     = useState<Player[]>([]);

  // Load challenge on mount: use the one forwarded by the host (via socket) if available,
  // otherwise generate a new one directly from the AI.
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

  // Populate the editor and player list once the challenge is available.
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

  // Keep the leaderboard in sync with score updates broadcast by the server.
  useEffect(() => {
    if (loadStatus !== 'ready') return;
    const socket = getSocket();

    socket.on('leaderboard_update', ({ board }: { board: { id: string; username: string; score: number; css: string }[] }) => {
      const myId = socket.id ?? currentUser?.id ?? 'me';
      board.forEach((p) => { if (p.id !== myId && p.css) playerCssRef.current.set(p.id, p.css); });
      setPlayers(board.map((p) => ({ id: p.id, username: p.username, score: p.score, isMe: p.id === myId })));
    });

    // Use the server timer as source of truth so all clients stay in sync.
    socket.on('time_sync', ({ timeLeft: serverTime }: { timeLeft: number }) => {
      setTimeLeft(serverTime);
    });

    return () => {
      socket.off('leaderboard_update');
      socket.off('time_sync');
    };
  }, [loadStatus, currentUser]);

  // Refs let handleEnd read the latest time/players/css without being listed as effect deps,
  // which would cause the interval to restart on every score update.
  const resultRef    = useRef<HTMLIFrameElement>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const playersRef   = useRef<Player[]>([]);
  const timeLeftRef  = useRef(timeLeft);
  const cssCodeRef   = useRef(cssCode);
  const playerCssRef = useRef<Map<string, string>>(new Map());

  useEffect(() => { playersRef.current  = players;  }, [players]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { cssCodeRef.current  = cssCode;  }, [cssCode]);

  // Debounced visual scoring ref — cleared on every keystroke, fired 800 ms after the last one.
  const visualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!challenge) return;
    const iframe = resultRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(buildDoc(htmlCode, cssCode));
    doc.close();

    // Skip scoring until the player actually modifies the starting CSS.
    if (cssCode.trim() === challenge.startCSS.trim() || !cssCode.trim()) {
      setPlayers((prev) => prev.map((p) => (p.isMe ? { ...p, score: 0 } : p)));
      getSocket().emit('code_update', { score: 0, css: '' });
      return;
    }

    if (visualTimerRef.current) clearTimeout(visualTimerRef.current);
    visualTimerRef.current = setTimeout(async () => {
      try {
        const score = await calcVisualScore(challenge.targetHTML, challenge.targetCSS, htmlCode, cssCode);
        setPlayers((prev) => prev.map((p) => (p.isMe ? { ...p, score } : p)));
        getSocket().emit('code_update', { score, css: cssCode });
      } catch {
        // Scoring failure is non-fatal — keep the previous score displayed.
      }
    }, SCORING_DEBOUNCE_MS);
  }, [htmlCode, cssCode, challenge]);

  const handleEnd = useCallback(() => {
    clearInterval(timerRef.current!);

    const current = playersRef.current;
    const elapsed = (currentRoom?.duration ?? 5) * 60 - timeLeftRef.current;
    const sorted  = [...current].sort((a, b) => b.score - a.score);
    const results: GameResult[] = sorted.map((p, i) => ({
      rank:        i + 1,
      user:        { id: p.id, username: p.isMe ? (currentUser?.username ?? 'tú') : p.username },
      similarity:  Math.round(p.score),
      submittedAt: new Date(),
      time:        elapsed,
      css:         p.isMe ? cssCodeRef.current : (playerCssRef.current.get(p.id) ?? ''),
    }));

    setGameState({
      roomId:    currentRoom?.id ?? '',
      challenge: {
        id:         challenge?.id ?? '',
        targetHTML: challenge?.targetHTML ?? '',
        targetCSS:  challenge?.targetCSS ?? '',
        difficulty: challenge?.difficulty ?? 'Fácil',
      },
      players: sorted.map((p) => ({ id: p.id, username: p.username })),
      status:  'finished',
      results,
    });

    onGameEnd(results);
  // timeLeft and players are intentionally excluded — the refs provide their values
  // so this callback stays stable for the lifetime of the game.
  }, [currentRoom, currentUser, challenge, setGameState, onGameEnd]);

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

  const hasEndedRef = useRef(false);
  useEffect(() => {
    if (timeLeft === 0 && loadStatus === 'ready' && !hasEndedRef.current) {
      hasEndedRef.current = true;
      handleEnd();
    }
  }, [timeLeft, loadStatus, handleEnd]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const myScore       = players.find((p) => p.isMe)?.score ?? 0;
  const lineCount     = (activeTab === 'html' ? htmlCode : cssCode).split('\n').length;

  const rankClass = (i: number) =>
    i === 0 ? styles.playerRankGold : i === 1 ? styles.playerRankSilver : i === 2 ? styles.playerRankBronze : '';

  const scoreColor = (s: number) =>
    s >= 75 ? '#22C55E' : s >= 40 ? '#FBBF24' : '#EF4444';

  if (loadStatus === 'loading') {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingIcon}>&gt;_</div>
        <div>
          <p className={styles.loadingTitle}>{t('arena_loading_title')}</p>
          <p className={styles.loadingSubtitle}>{t('arena_loading_subtitle')}</p>
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
        <p className={styles.errorTitle}>{t('arena_error_title')}</p>
        <p className={styles.errorMsg}>{t('arena_error_msg')}</p>
        <button className={styles.errorBtn} onClick={retry}>{t('arena_retry')}</button>
        <button className={styles.errorBtnBack} onClick={onExit}>
          {t('arena_back')}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>CSS Arena</span>
          </div>
          <div className={styles.roomCode}># {currentRoom?.code ?? 'DEMO'}</div>
        </div>

        <div className={styles.timer}>
          <span className={styles.timerIcon}>⏱</span>
          <span className={`${styles.timerText} ${timeLeft < 60 ? styles.timerWarning : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.headerBtn} onClick={onExit}>
            <LogOut size={13} className={styles.headerBtnIcon} />
            {t('arena_exit')}
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Code editor */}
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
            <span className={styles.lineCount}>{lineCount} {t('arena_lines')}</span>
          </div>

          <div className={styles.editorWrapper}>
            <Editor
              key={activeTab}
              language={activeTab}
              value={activeTab === 'html' ? htmlCode : cssCode}
              onChange={(val) => activeTab === 'html' ? setHtmlCode(val ?? '') : setCssCode(val ?? '')}
              theme="vs-dark"
              beforeMount={(monaco) => {
                // Safe to call on every remount — registerCssCompletions guards against duplicate registration.
                registerCssCompletions(monaco);
              }}
              onMount={(editor) => {
                // Trigger suggestions on every keystroke because CDN-loaded Monaco workers
                // may not finish initializing before the user starts typing.
                editor.onDidChangeModelContent(() => {
                  const pos   = editor.getPosition();
                  const model = editor.getModel();
                  if (!pos || !model) return;
                  if (model.getWordUntilPosition(pos).word.length > 0) {
                    editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
                  }
                });
              }}
              options={{
                minimap:                  { enabled: false },
                fontSize:                 13,
                lineNumbers:              'on',
                scrollBeyondLastLine:     false,
                wordWrap:                 'on',
                padding:                  { top: 8, bottom: 8 },
                fontFamily:               "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                automaticLayout:          true,
                quickSuggestions:         true,
                quickSuggestionsDelay:    0,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter:  'on',
                tabCompletion:            'on',
                wordBasedSuggestions:     'off',
                suggest:                  { showWords: false },
                hover:                    { enabled: true },
                formatOnPaste:            true,
              }}
            />
          </div>
        </div>

        {/* Live previews */}
        <div className={styles.previewPanel}>
          <div className={`${styles.previewSection} ${styles.previewSectionTarget}`}>
            <div className={styles.previewHeader}>
              <span className={styles.previewDot} style={{ background: '#6366F1' }} />
              {t('arena_ai_objective')}
            </div>
            <div className={styles.previewContent}>
              <iframe
                srcDoc={buildDoc(challenge!.targetHTML, challenge!.targetCSS)}
                sandbox="allow-scripts"
                className={styles.previewIframe}
                title="AI objective"
              />
            </div>
          </div>

          <div className={`${styles.previewSection} ${styles.previewSectionResult}`}>
            <div className={styles.previewHeader}>
              <span className={`${styles.previewDot} ${styles.previewDotLive}`} style={{ background: '#00FF88' }} />
              {t('arena_your_result')}
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
                title="Your result"
              />
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className={styles.leaderboard}>
          <div className={styles.leaderboardHeader}>
            <span className={styles.leaderboardIcon}>🏆</span>
            {t('arena_leaderboard')}
          </div>
          <div className={styles.playerList}>
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className={`${styles.playerRow} ${p.isMe ? styles.playerRowMe : ''}`}>
                <span className={`${styles.playerRank} ${rankClass(i)}`}>{i + 1}</span>
                <span className={`${styles.playerName} ${p.isMe ? styles.playerNameMe : ''}`}>
                  {p.isMe ? `${t('arena_you')} (${currentUser?.username ?? t('arena_you')})` : p.username}
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
