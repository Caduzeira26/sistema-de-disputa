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

export interface BasketRecord {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  points: number;
}

export interface PointsStanding {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  points: number;
}

/** Basquete's "artilharia": total points scored, not basket count. */
export function computeTopPointScorers(baskets: BasketRecord[]): PointsStanding[] {
  const table = new Map<string, PointsStanding>();
  for (const b of baskets) {
    const existing = table.get(b.playerId);
    if (existing) existing.points += b.points;
    else table.set(b.playerId, { playerId: b.playerId, playerName: b.playerName, teamId: b.teamId, teamName: b.teamName, points: b.points });
  }
  return [...table.values()].sort((a, b) => b.points - a.points || a.playerName.localeCompare(b.playerName));
}

export interface FoulRecord {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
}

export interface FoulStanding {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  fouls: number;
}

/** Basquete: personal fouls per player, most first. */
export function computeFoulRanking(fouls: FoulRecord[]): FoulStanding[] {
  const table = new Map<string, FoulStanding>();
  for (const f of fouls) {
    const existing = table.get(f.playerId);
    if (existing) existing.fouls += 1;
    else table.set(f.playerId, { playerId: f.playerId, playerName: f.playerName, teamId: f.teamId, teamName: f.teamName, fouls: 1 });
  }
  return [...table.values()].sort((a, b) => b.fouls - a.fouls || a.playerName.localeCompare(b.playerName));
}

export interface GoalkeeperRecord {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
}

export interface TeamMatchConceded {
  teamId: string;
  goalsConceded: number;
}

export interface GoalkeeperStanding {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  goalsConceded: number;
  average: number;
}

/**
 * Best goalkeeper: lowest average goals conceded per match. There's no
 * record of which goalkeeper played which match, so every goalkeeper
 * flagged on a team shares that team's full conceded/matches tally —
 * fine for the common case of one goalkeeper per team, approximate for
 * teams with more than one. Goalkeepers whose team hasn't played a match
 * yet are left out rather than shown with an undefined average.
 */
export function computeGoalkeeperRanking(
  goalkeepers: GoalkeeperRecord[],
  teamMatches: TeamMatchConceded[]
): GoalkeeperStanding[] {
  const byTeam = new Map<string, { conceded: number; matches: number }>();
  for (const tm of teamMatches) {
    const existing = byTeam.get(tm.teamId) ?? { conceded: 0, matches: 0 };
    existing.conceded += tm.goalsConceded;
    existing.matches += 1;
    byTeam.set(tm.teamId, existing);
  }

  return goalkeepers
    .map((gk) => {
      const stats = byTeam.get(gk.teamId) ?? { conceded: 0, matches: 0 };
      return {
        playerId: gk.playerId,
        playerName: gk.playerName,
        teamId: gk.teamId,
        teamName: gk.teamName,
        matchesPlayed: stats.matches,
        goalsConceded: stats.conceded,
        average: stats.matches > 0 ? stats.conceded / stats.matches : 0,
      };
    })
    .filter((s) => s.matchesPlayed > 0)
    .sort((a, b) => a.average - b.average || a.playerName.localeCompare(b.playerName));
}

export interface TableTennisPlayer {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
}

export interface GameResultRecord {
  winnerSide: "HOME" | "AWAY" | null;
  homePlayers: TableTennisPlayer[];
  awayPlayers: TableTennisPlayer[];
}

export interface GameWinStanding {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  wins: number;
}

/** Tênis de mesa: individual games won, per athlete (both players of a doubles win are credited). */
export function computeGameWinRanking(games: GameResultRecord[]): GameWinStanding[] {
  const table = new Map<string, GameWinStanding>();
  for (const g of games) {
    if (!g.winnerSide) continue;
    const winners = g.winnerSide === "HOME" ? g.homePlayers : g.awayPlayers;
    for (const p of winners) {
      const existing = table.get(p.id);
      if (existing) existing.wins += 1;
      else table.set(p.id, { playerId: p.id, playerName: p.name, teamId: p.teamId, teamName: p.teamName, wins: 1 });
    }
  }
  return [...table.values()].sort((a, b) => b.wins - a.wins || a.playerName.localeCompare(b.playerName));
}
