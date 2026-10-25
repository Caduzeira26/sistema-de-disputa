import { eliminationByeIndices } from "@/lib/bracket";

function isPowerOfTwo(n: number): boolean {
  return n >= 1 && (n & (n - 1)) === 0;
}

/**
 * Orders group qualifiers for the knockout list (consecutive non-bye entries
 * form round-1 pairs) so teams from the same group can't meet in round 1.
 *
 * `byGroup[g]` is group g's qualifiers best-first.
 *
 * - 2 qualifiers per group and a power-of-two number of groups (no byes):
 *   the official crossing, 1A x 2B and 1C x 2D on one half of the bracket,
 *   1B x 2A and 1D x 2C on the other.
 * - 2 qualifiers per group, any other number of groups: the bracket needs
 *   byes, which shift the pairing, so group winners take the bye slots and
 *   each remaining winner faces the next group's runner-up (rotating).
 * - Any other qualifier count: plain order (winners of every group first).
 */
export function orderQualifiersForBracket(byGroup: string[][]): string[] {
  const groups = byGroup.length;
  const advance = groups === 0 ? 0 : Math.min(...byGroup.map((g) => g.length));

  if (groups < 2 || advance !== 2) return byGroup.flatMap((g) => g);

  if (isPowerOfTwo(groups)) {
    const topHalf: string[] = [];
    const bottomHalf: string[] = [];
    for (let g = 0; g < groups; g += 2) {
      topHalf.push(byGroup[g][0], byGroup[g + 1][1]);
      bottomHalf.push(byGroup[g + 1][0], byGroup[g][1]);
    }
    return [...topHalf, ...bottomHalf];
  }

  const total = groups * 2;
  const byeSlots = eliminationByeIndices(total);
  const playingSlots = Array.from({ length: total }, (_, i) => i).filter((i) => !byeSlots.includes(i));

  const winners = byGroup.map((g) => g[0]);
  const runnersUp = byGroup.map((g) => g[1]);

  const byeTeams = winners.slice(0, byeSlots.length);
  const playingWinners = winners.slice(byeSlots.length);

  const usedRunnerUp = new Set<number>();
  const pairs: string[][] = [];
  playingWinners.forEach((winner, i) => {
    const winnerGroup = byeSlots.length + i;
    const opponentGroup = (winnerGroup + 1) % groups;
    usedRunnerUp.add(opponentGroup);
    pairs.push([winner, runnersUp[opponentGroup]]);
  });
  const leftoverRunners = runnersUp.filter((_, g) => !usedRunnerUp.has(g));
  for (let i = 0; i < leftoverRunners.length; i += 2) {
    pairs.push([leftoverRunners[i], leftoverRunners[i + 1]]);
  }

  const list = new Array<string>(total);
  byeSlots.forEach((slot, i) => (list[slot] = byeTeams[i]));
  pairs.flat().forEach((teamId, i) => (list[playingSlots[i]] = teamId));
  return list;
}
