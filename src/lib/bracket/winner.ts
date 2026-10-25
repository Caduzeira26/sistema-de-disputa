export interface Penalties {
  home: number;
  away: number;
}

/**
 * Who won a played match: the higher score, or — when the score is level and
 * a penalty shootout was played — the higher penalty tally. Null while it's
 * still undecided (level with no usable shootout, or scores not recorded).
 */
export function decideWinnerSide(
  homeScore: number | null,
  awayScore: number | null,
  penalties?: Penalties | null
): "HOME" | "AWAY" | null {
  if (homeScore === null || awayScore === null) return null;
  if (homeScore !== awayScore) return homeScore > awayScore ? "HOME" : "AWAY";
  if (penalties && penalties.home !== penalties.away) return penalties.home > penalties.away ? "HOME" : "AWAY";
  return null;
}

/** Packs two nullable DB columns into a Penalties value (null unless both exist). */
export function toPenalties(home: number | null | undefined, away: number | null | undefined): Penalties | null {
  return home === null || home === undefined || away === null || away === undefined ? null : { home, away };
}
