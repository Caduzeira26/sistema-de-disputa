export interface GoalRecord {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
}

export interface CardRecord {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  type: "YELLOW" | "RED";
}

export interface ScorerStanding {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  goals: number;
}

export interface CardStanding {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  yellow: number;
  red: number;
}

/** Top scorers: most goals first, then alphabetically for a stable order. */
export function computeTopScorers(goals: GoalRecord[]): ScorerStanding[] {
  const table = new Map<string, ScorerStanding>();
  for (const g of goals) {
    const existing = table.get(g.playerId);
    if (existing) existing.goals += 1;
    else table.set(g.playerId, { playerId: g.playerId, playerName: g.playerName, teamId: g.teamId, teamName: g.teamName, goals: 1 });
  }
  return [...table.values()].sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName));
}

/** Card ranking: most red cards first, then most yellow cards, then alphabetically. */
export function computeCardRanking(cards: CardRecord[]): CardStanding[] {
  const table = new Map<string, CardStanding>();
  for (const c of cards) {
    let existing = table.get(c.playerId);
    if (!existing) {
      existing = { playerId: c.playerId, playerName: c.playerName, teamId: c.teamId, teamName: c.teamName, yellow: 0, red: 0 };
      table.set(c.playerId, existing);
    }
    if (c.type === "YELLOW") existing.yellow += 1;
    else existing.red += 1;
  }
  return [...table.values()].sort(
    (a, b) => b.red - a.red || b.yellow - a.yellow || a.playerName.localeCompare(b.playerName)
  );
}
