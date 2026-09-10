export interface PointEntry {
  teamId: string;
  points: number;
}

/** Basquete: sums basket points per side to get the match's home/away score. */
export function sumPointsByTeam(entries: PointEntry[], homeTeamId: string, awayTeamId: string): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const e of entries) {
    if (e.teamId === homeTeamId) home += e.points;
    else if (e.teamId === awayTeamId) away += e.points;
  }
  return { home, away };
}
