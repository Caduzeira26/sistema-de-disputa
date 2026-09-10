export interface GameOutcome {
  winnerSide: "HOME" | "AWAY" | null;
}

/** Counts games won by each side in a tie — only decided games count. */
export function countGamesWon(games: GameOutcome[]): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const g of games) {
    if (g.winnerSide === "HOME") home += 1;
    else if (g.winnerSide === "AWAY") away += 1;
  }
  return { home, away };
}
