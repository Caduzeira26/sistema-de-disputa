import { randomInt } from "node:crypto";

/** Returns an integer in [0, maxExclusive). Injectable so tests can use a fixed seed. */
export type Rng = (maxExclusive: number) => number;

export const cryptoRng: Rng = (maxExclusive) => randomInt(maxExclusive);

/** Deterministic mulberry32 generator, for tests. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return (maxExclusive) => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * maxExclusive);
  };
}

/** Fisher-Yates shuffle, returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
