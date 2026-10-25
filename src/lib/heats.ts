/**
 * Just Dance in heats ("baterias"): dancers play the same song at the same
 * time, in groups of up to 4. The best of each heat advance; rounds repeat
 * until a single heat remains, which is the final.
 */
export const HEAT_SIZE = 4;

/** How many dancers move on from a heat: the top 2, or just the winner of a 2-dancer heat. */
export function advanceCount(heatSize: number): number {
  return heatSize <= 2 ? 1 : 2;
}

/** A round with this many dancers fits in one heat, so it is the final. */
export function isFinalRound(dancerCount: number): boolean {
  return dancerCount <= HEAT_SIZE;
}

/** Splits `dancerCount` into as few heats of at most 4 as possible, as evenly as possible (10 -> 4, 3, 3). */
export function planHeatSizes(dancerCount: number): number[] {
  if (dancerCount < 1) return [];
  const heats = Math.ceil(dancerCount / HEAT_SIZE);
  const base = Math.floor(dancerCount / heats);
  const extra = dancerCount % heats;
  return Array.from({ length: heats }, (_, i) => base + (i < extra ? 1 : 0));
}

export interface ScoreInput {
  teamId: string;
  score: number;
}

export type RankResult =
  | { ok: true; placements: { teamId: string; placement: number; score: number }[] }
  | { ok: false; error: string };

/**
 * Ranks a heat by song score (higher wins). Scores must be whole numbers
 * of at least 0, and no two dancers may tie: a tie has to be settled by
 * replaying the song, since the advance/eliminate line can't be decided
 * from equal scores.
 */
export function rankHeatByScore(entries: ScoreInput[], names: Record<string, string> = {}): RankResult {
  for (const e of entries) {
    if (!Number.isInteger(e.score) || e.score < 0) {
      return { ok: false, error: "A pontuação deve ser um número inteiro maior ou igual a zero." };
    }
  }

  const sorted = [...entries].sort((a, b) => b.score - a.score);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].score === sorted[i - 1].score) {
      const a = names[sorted[i - 1].teamId] ?? "dois dançarinos";
      const b = names[sorted[i].teamId];
      return {
        ok: false,
        error: b
          ? `Empate de pontuação entre ${a} e ${b}. Repitam a música para desempatar e lancem a nova pontuação.`
          : "Empate de pontuação. Repitam a música para desempatar e lancem a nova pontuação.",
      };
    }
  }

  return { ok: true, placements: sorted.map((e, i) => ({ teamId: e.teamId, placement: i + 1, score: e.score })) };
}

export interface Advancer {
  teamId: string;
  /** Placement in the heat they came from (1 = won it). */
  placement: number;
  /** Index of the heat they came from, so dancers of one heat get spread across the next round. */
  fromHeat: number;
}

/**
 * Builds the next round's heats from the advancers. Dancers are taken best
 * placement first (ties by origin heat) and each goes to a heat with room
 * that doesn't already hold someone from the same previous heat (so nobody
 * meets the dancer they just played against, when it can be avoided),
 * preferring the emptiest such heat so winners spread out and sizes follow
 * `planHeatSizes`.
 */
export function nextRoundHeats(advancers: Advancer[]): string[][] {
  const sizes = planHeatSizes(advancers.length);
  const ordered = [...advancers].sort((a, b) => a.placement - b.placement || a.fromHeat - b.fromHeat);
  const heats: { teamId: string; fromHeat: number }[][] = sizes.map(() => []);

  for (const dancer of ordered) {
    const withRoom = heats.map((_, i) => i).filter((i) => heats[i].length < sizes[i]);
    const noRematch = withRoom.filter((i) => !heats[i].some((m) => m.fromHeat === dancer.fromHeat));
    const candidates = noRematch.length > 0 ? noRematch : withRoom;
    const target = candidates.reduce((best, i) => (heats[i].length < heats[best].length ? i : best), candidates[0]);
    heats[target].push({ teamId: dancer.teamId, fromHeat: dancer.fromHeat });
  }
  return heats.map((heat) => heat.map((m) => m.teamId));
}
