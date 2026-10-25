/**
 * Free Fire scoring, as in the LBFF: each team earns points for where it
 * finished in the match (a "queda") plus 1 point per kill, with no cap on
 * kills. 1st place is the Booyah.
 */
export const PLACEMENT_POINTS = [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0] as const;
export const POINTS_PER_KILL = 1;
/** A Free Fire custom room holds 12 squads. */
export const LOBBY_SIZE = 12;

export function placementPoints(placement: number): number {
  return PLACEMENT_POINTS[placement - 1] ?? 0;
}

export function entryPoints(placement: number, kills: number): number {
  return placementPoints(placement) + kills * POINTS_PER_KILL;
}

export interface EntryInput {
  teamId: string;
  placement: number;
  kills: number;
}

/** Returns an error message in Portuguese, or null when the match sheet is valid. */
export function validateRoundEntries(entries: EntryInput[]): string | null {
  const count = entries.length;
  const seen = new Set<number>();
  for (const e of entries) {
    if (!Number.isInteger(e.placement) || e.placement < 1 || e.placement > count) {
      return `A colocação deve ser um número de 1 a ${count}.`;
    }
    if (seen.has(e.placement)) {
      return `Duas equipes estão com a ${e.placement}ª colocação. Cada colocação só pode ser usada uma vez.`;
    }
    seen.add(e.placement);
    if (!Number.isInteger(e.kills) || e.kills < 0) {
      return "Os abates devem ser um número inteiro maior ou igual a zero.";
    }
  }
  return null;
}

export interface RoundResult {
  number: number;
  entries: { teamId: string; placement: number | null; kills: number }[];
}

export interface StandingRow {
  teamId: string;
  points: number;
  booyahs: number;
  kills: number;
  placementPoints: number;
  /** Points scored in each round, in round order (only finished rounds). */
  perRound: number[];
  /** Placement in the most recent finished round (lower is better); used as the last tiebreaker. */
  lastPlacement: number;
}

/**
 * Cumulative standings over the finished rounds. Tiebreakers, in order:
 * total points, number of Booyahs, total kills, then the better placement in
 * the last queda played. (Placement points aren't a separate tiebreaker:
 * points = placement points + kills, so once points and kills tie they tie too.)
 */
export function computeLobbyStandings(teamIds: string[], rounds: RoundResult[]): StandingRow[] {
  const ordered = [...rounds].sort((a, b) => a.number - b.number);
  const rows = new Map<string, StandingRow>(
    teamIds.map((teamId) => [
      teamId,
      { teamId, points: 0, booyahs: 0, kills: 0, placementPoints: 0, perRound: [], lastPlacement: Number.MAX_SAFE_INTEGER },
    ])
  );

  for (const round of ordered) {
    const finished = round.entries.filter((e) => e.placement !== null);
    if (finished.length === 0) continue;
    for (const e of finished) {
      const row = rows.get(e.teamId);
      if (!row) continue;
      const placementPts = placementPoints(e.placement!);
      row.placementPoints += placementPts;
      row.kills += e.kills;
      row.points += placementPts + e.kills * POINTS_PER_KILL;
      if (e.placement === 1) row.booyahs += 1;
      row.perRound.push(placementPts + e.kills * POINTS_PER_KILL);
      row.lastPlacement = e.placement!;
    }
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.booyahs - a.booyahs ||
      b.kills - a.kills ||
      a.lastPlacement - b.lastPlacement ||
      a.teamId.localeCompare(b.teamId)
  );
}
