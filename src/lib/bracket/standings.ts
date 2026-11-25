export interface StandingsInputMatch {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  /** Shootouts (Kings League): decidem o vencedor quando o placar empata. */
  homePenalties?: number | null;
  awayPenalties?: number | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "FINISHED";
}

export interface TeamStanding {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  /** Kings League: vitórias e derrotas nos shootouts (contam à parte de V e D). */
  shootoutWins: number;
  shootoutLosses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface PointsConfig {
  win: number;
  draw: number;
  loss: number;
  /** Pontos de quem vence / perde nos shootouts. Só usados quando o empate tem shootouts. */
  shootoutWin?: number;
  shootoutLoss?: number;
}

const DEFAULT_POINTS: PointsConfig = { win: 3, draw: 1, loss: 0 };

/**
 * Group-stage standings, computed fresh from finished matches every time
 * (never stored) so they can never drift out of sync with match results.
 * Sort order: points, wins (shootout wins included), goal difference, goals for, then team id (a
 * stable, deterministic tie-break — no head-to-head comparison yet).
 */
export function computeStandings(
  teamIds: string[],
  matches: StandingsInputMatch[],
  points: PointsConfig = DEFAULT_POINTS
): TeamStanding[] {
  const table = new Map<string, TeamStanding>();
  for (const id of teamIds) {
    table.set(id, {
      teamId: id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      shootoutWins: 0,
      shootoutLosses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    if (m.status !== "FINISHED") continue;
    if (m.homeTeamId === null || m.awayTeamId === null) continue;
    if (m.homeScore === null || m.awayScore === null) continue;
    const home = table.get(m.homeTeamId);
    const away = table.get(m.awayTeamId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.wins += 1;
      home.points += points.win;
      away.losses += 1;
      away.points += points.loss;
    } else if (m.homeScore < m.awayScore) {
      away.wins += 1;
      away.points += points.win;
      home.losses += 1;
      home.points += points.loss;
    } else if (m.homePenalties != null && m.awayPenalties != null && m.homePenalties !== m.awayPenalties) {
      const [winner, loser] = m.homePenalties > m.awayPenalties ? [home, away] : [away, home];
      winner.shootoutWins += 1;
      winner.points += points.shootoutWin ?? points.win;
      loser.shootoutLosses += 1;
      loser.points += points.shootoutLoss ?? points.loss;
    } else {
      home.draws += 1;
      home.points += points.draw;
      away.draws += 1;
      away.points += points.draw;
    }
  }

  for (const t of table.values()) {
    t.goalDifference = t.goalsFor - t.goalsAgainst;
  }

  return [...table.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const winsA = a.wins + a.shootoutWins;
    const winsB = b.wins + b.shootoutWins;
    if (winsB !== winsA) return winsB - winsA;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamId.localeCompare(b.teamId);
  });
}

/** Pontuação configurada no torneio (Kings League inclui os pontos dos shootouts). */
export function pointsConfigFor(t: {
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  pointsShootoutWin: number;
  pointsShootoutLoss: number;
}): PointsConfig {
  return {
    win: t.pointsWin,
    draw: t.pointsDraw,
    loss: t.pointsLoss,
    shootoutWin: t.pointsShootoutWin,
    shootoutLoss: t.pointsShootoutLoss,
  };
}
