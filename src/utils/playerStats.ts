export interface PlayerStats {
  wins: number;
  streak: number;
  gamesPlayed: number;
}

const DEFAULT_STATS: PlayerStats = { wins: 0, streak: 0, gamesPlayed: 0 };

const storageKey = (username: string) => `css-arena:stats:${username}`;

export function getStats(username: string): PlayerStats {
  try {
    const raw = localStorage.getItem(storageKey(username));
    return raw ? (JSON.parse(raw) as PlayerStats) : { ...DEFAULT_STATS };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function recordResult(username: string, won: boolean): PlayerStats {
  const prev = getStats(username);
  const next: PlayerStats = {
    wins:        prev.wins + (won ? 1 : 0),
    streak:      won ? prev.streak + 1 : 0,
    gamesPlayed: prev.gamesPlayed + 1,
  };
  localStorage.setItem(storageKey(username), JSON.stringify(next));
  return next;
}
