export interface PlayerStats {
  wins: number;
  streak: number;
  gamesPlayed: number;
}

const key = (username: string) => `css-arena:stats:${username}`;

export function getStats(username: string): PlayerStats {
  try {
    const raw = localStorage.getItem(key(username));
    return raw ? (JSON.parse(raw) as PlayerStats) : { wins: 0, streak: 0, gamesPlayed: 0 };
  } catch {
    return { wins: 0, streak: 0, gamesPlayed: 0 };
  }
}

export function recordResult(username: string, won: boolean): PlayerStats {
  const prev = getStats(username);
  const next: PlayerStats = {
    wins: prev.wins + (won ? 1 : 0),
    streak: won ? prev.streak + 1 : 0,
    gamesPlayed: prev.gamesPlayed + 1,
  };
  localStorage.setItem(key(username), JSON.stringify(next));
  return next;
}
