import { describe, expect, it } from "vitest";
import { eliminationByeIndices, generateSingleElimination } from "./index";

describe("eliminationByeIndices", () => {
  it("matches the real generated tree for every field size from 2 to 40", () => {
    for (let n = 2; n <= 40; n++) {
      const teams = Array.from({ length: n }, (_, i) => ({ id: `t${i}`, seed: i + 1 }));
      const { matches } = generateSingleElimination(teams);

      const round1 = matches.filter((m) => m.round === 1);
      const playing = new Set<string>();
      for (const m of round1) {
        playing.add(m.homeTeamId!);
        playing.add(m.awayTeamId!);
      }
      const actualByes = teams.map((t, i) => (playing.has(t.id) ? -1 : i)).filter((i) => i >= 0);

      expect(eliminationByeIndices(n), `n=${n}`).toEqual(actualByes);
    }
  });

  it("pairs the non-bye positions consecutively in round 1", () => {
    for (let n = 2; n <= 40; n++) {
      const teams = Array.from({ length: n }, (_, i) => ({ id: `t${i}`, seed: i + 1 }));
      const { matches } = generateSingleElimination(teams);

      const byeSet = new Set(eliminationByeIndices(n));
      const playingSlots = Array.from({ length: n }, (_, i) => i).filter((i) => !byeSet.has(i));
      const expectedPairs = new Set<string>();
      for (let i = 0; i < playingSlots.length; i += 2) {
        expectedPairs.add(`t${playingSlots[i]}-t${playingSlots[i + 1]}`);
      }

      const actualPairs = new Set(matches.filter((m) => m.round === 1).map((m) => `${m.homeTeamId}-${m.awayTeamId}`));
      expect(actualPairs, `n=${n}`).toEqual(expectedPairs);
    }
  });

  it("has no byes for a power of two", () => {
    expect(eliminationByeIndices(8)).toEqual([]);
    expect(eliminationByeIndices(16)).toEqual([]);
  });
});
