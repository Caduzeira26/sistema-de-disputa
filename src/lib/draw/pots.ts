import type { DrawTeam } from "./types";

/** Teams without a pot go to the last pot (or pot 1 if nobody has a pot). */
export function resolvePots(teams: DrawTeam[]): Map<number, string[]> {
  const highestAssigned = teams.reduce((max, t) => Math.max(max, t.pot ?? 0), 0);
  const fallbackPot = Math.max(highestAssigned, 1);
  const pots = new Map<number, string[]>();
  for (const team of teams) {
    const pot = team.pot ?? fallbackPot;
    pots.set(pot, [...(pots.get(pot) ?? []), team.id]);
  }
  return new Map([...pots.entries()].sort(([a], [b]) => a - b));
}
