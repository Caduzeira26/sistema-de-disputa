import { eliminationByeIndices } from "@/lib/bracket";
import { resolvePots } from "./pots";
import { shuffle, type Rng } from "./rng";
import type { DrawStep, DrawTeam } from "./types";

/**
 * Knockout draw. Returns steps in reveal order (pot by pot); each step's
 * `slot` is the team's position in the list `buildEliminationTree` consumes.
 *
 * - Bye slots (round-1 free passes) go to the best pots, like top seeds.
 * - The remaining slots form consecutive round-1 pairs; the better half of
 *   the field takes the first slot of each pair and the weaker half the
 *   second, so pot 1 meets the last pot (Copa do Brasil style).
 * - Within a pot, who lands where is drawn at random.
 */
export function drawKnockout(teams: DrawTeam[], rng: Rng): DrawStep[] {
  const n = teams.length;
  if (n < 2) throw new Error("drawKnockout: precisa de pelo menos 2 equipes");

  const potOf = new Map<string, number>();
  const orderedByPot: string[] = [];
  for (const [pot, ids] of resolvePots(teams)) {
    for (const id of shuffle(ids, rng)) {
      potOf.set(id, pot);
      orderedByPot.push(id);
    }
  }

  const byeSlots = eliminationByeIndices(n);
  const byeSet = new Set(byeSlots);
  const playingSlots = Array.from({ length: n }, (_, i) => i).filter((i) => !byeSet.has(i));

  const slotOf = new Map<string, number>();
  const byeTeams = orderedByPot.slice(0, byeSlots.length);
  shuffle(byeSlots, rng).forEach((slot, i) => slotOf.set(byeTeams[i], slot));

  const playing = orderedByPot.slice(byeSlots.length);
  const pairs = playingSlots.length / 2;
  const stronger = shuffle(playing.slice(0, pairs), rng);
  const weaker = shuffle(playing.slice(pairs), rng);
  for (let p = 0; p < pairs; p++) {
    slotOf.set(stronger[p], playingSlots[p * 2]);
    slotOf.set(weaker[p], playingSlots[p * 2 + 1]);
  }

  return orderedByPot.map((teamId) => ({ teamId, pot: potOf.get(teamId)!, slot: slotOf.get(teamId)! }));
}
