import { resolvePots } from "./pots";
import { shuffle, type Rng } from "./rng";
import type { DrawStep, DrawTeam } from "./types";

/**
 * World-Cup-style group draw: pot by pot, each team (taken in random order)
 * lands in a random group among those that don't yet hold a team from the
 * same pot. If a pot is bigger than the number of groups, it falls back to
 * the groups holding the fewest teams from it, and group sizes stay as even
 * as possible overall.
 */
export function drawGroups(teams: DrawTeam[], numGroups: number, rng: Rng): DrawStep[] {
  if (numGroups < 1) throw new Error("drawGroups: numGroups must be >= 1");
  if (teams.length < numGroups) throw new Error("drawGroups: mais grupos do que equipes");

  const groupSizes = new Array<number>(numGroups).fill(0);
  const steps: DrawStep[] = [];

  for (const [pot, teamIds] of resolvePots(teams)) {
    const fromThisPot = new Array<number>(numGroups).fill(0);

    for (const teamId of shuffle(teamIds, rng)) {
      const minFromPot = Math.min(...fromThisPot);
      let candidates = fromThisPot.map((count, g) => (count === minFromPot ? g : -1)).filter((g) => g >= 0);

      const minSize = Math.min(...candidates.map((g) => groupSizes[g]));
      candidates = candidates.filter((g) => groupSizes[g] === minSize);

      const groupIndex = candidates[rng(candidates.length)];
      fromThisPot[groupIndex] += 1;
      groupSizes[groupIndex] += 1;
      steps.push({ teamId, pot, groupIndex });
    }
  }
  return steps;
}
