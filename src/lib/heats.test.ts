import { describe, expect, it } from "vitest";
import { advanceCount, isFinalRound, nextRoundHeats, planHeatSizes, rankHeatByScore } from "./heats";

describe("planHeatSizes", () => {
  it("uses as few heats of at most 4 as possible, balanced", () => {
    expect(planHeatSizes(4)).toEqual([4]);
    expect(planHeatSizes(5)).toEqual([3, 2]);
    expect(planHeatSizes(8)).toEqual([4, 4]);
    expect(planHeatSizes(10)).toEqual([4, 3, 3]);
    expect(planHeatSizes(13)).toEqual([4, 3, 3, 3]);
  });

  it("never exceeds 4 per heat nor loses anyone, for 1..64 dancers", () => {
    for (let n = 1; n <= 64; n++) {
      const sizes = planHeatSizes(n);
      expect(sizes.reduce((a, b) => a + b, 0), `n=${n}`).toBe(n);
      expect(Math.max(...sizes), `n=${n}`).toBeLessThanOrEqual(4);
      expect(Math.max(...sizes) - Math.min(...sizes), `n=${n}`).toBeLessThanOrEqual(1);
    }
  });
});

describe("advanceCount / isFinalRound", () => {
  it("advances the top 2, or only the winner of a 2-dancer heat", () => {
    expect(advanceCount(4)).toBe(2);
    expect(advanceCount(3)).toBe(2);
    expect(advanceCount(2)).toBe(1);
  });

  it("treats a round that fits in one heat as the final", () => {
    expect(isFinalRound(4)).toBe(true);
    expect(isFinalRound(2)).toBe(true);
    expect(isFinalRound(5)).toBe(false);
  });

  it("always shrinks the field until it reaches a single heat, for 2..200 dancers", () => {
    for (let start = 2; start <= 200; start++) {
      let dancers = start;
      let rounds = 0;
      while (!isFinalRound(dancers)) {
        dancers = planHeatSizes(dancers).reduce((sum, size) => sum + advanceCount(size), 0);
        rounds++;
        expect(rounds, `start=${start}`).toBeLessThan(20);
      }
      expect(dancers, `start=${start}`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("rankHeatByScore", () => {
  const names = { a: "Ana", b: "Bia", c: "Caio", d: "Davi" };

  it("ranks by the higher song score", () => {
    const result = rankHeatByScore(
      [
        { teamId: "a", score: 9000 },
        { teamId: "b", score: 12000 },
        { teamId: "c", score: 11000 },
        { teamId: "d", score: 500 },
      ],
      names
    );
    expect(result).toEqual({
      ok: true,
      placements: [
        { teamId: "b", placement: 1, score: 12000 },
        { teamId: "c", placement: 2, score: 11000 },
        { teamId: "a", placement: 3, score: 9000 },
        { teamId: "d", placement: 4, score: 500 },
      ],
    });
  });

  it("rejects a tie and tells who tied, asking for the song to be replayed", () => {
    const result = rankHeatByScore(
      [
        { teamId: "a", score: 9000 },
        { teamId: "b", score: 9000 },
      ],
      names
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Empate.*Ana.*Bia.*Repitam a música/);
  });

  it("rejects negative or fractional scores", () => {
    expect(rankHeatByScore([{ teamId: "a", score: -1 }]).ok).toBe(false);
    expect(rankHeatByScore([{ teamId: "a", score: 10.5 }]).ok).toBe(false);
  });

  it("accepts a score of zero", () => {
    expect(rankHeatByScore([{ teamId: "a", score: 0 }, { teamId: "b", score: 5 }]).ok).toBe(true);
  });
});

describe("nextRoundHeats", () => {
  const advancers = (heats: number) =>
    Array.from({ length: heats }, (_, h) => [
      { teamId: `h${h}w`, placement: 1, fromHeat: h },
      { teamId: `h${h}r`, placement: 2, fromHeat: h },
    ]).flat();

  it("places everyone exactly once and respects the planned heat sizes", () => {
    for (let heats = 2; heats <= 10; heats++) {
      const input = advancers(heats);
      const result = nextRoundHeats(input);
      expect(result.map((h) => h.length), `heats=${heats}`).toEqual(planHeatSizes(input.length));
      expect(result.flat().sort(), `heats=${heats}`).toEqual(input.map((a) => a.teamId).sort());
    }
  });

  it("spreads the heat winners across different heats when there are several heats", () => {
    const result = nextRoundHeats(advancers(6)); // 12 advancers -> 3 heats of 4
    const winnersPerHeat = result.map((heat) => heat.filter((id) => id.endsWith("w")).length);
    expect(Math.max(...winnersPerHeat)).toBeLessThanOrEqual(2);
  });

  it("never puts the two advancers of one heat together when it can avoid it (3 heats of 4)", () => {
    const result = nextRoundHeats(advancers(6));
    for (const heat of result) {
      const origins = heat.map((id) => id.slice(0, 2));
      expect(new Set(origins).size).toBe(origins.length);
    }
  });

  it("avoids rematches for every field from 3 to 16 previous heats", () => {
    for (let heats = 3; heats <= 16; heats++) {
      const result = nextRoundHeats(advancers(heats));
      for (const heat of result) {
        const origins = heat.map((id) => id.replace(/[wr]$/, ""));
        expect(new Set(origins).size, `previous heats=${heats}`).toBe(origins.length);
      }
    }
  });

  it("makes a single heat when 4 or fewer advance", () => {
    expect(nextRoundHeats(advancers(2))).toHaveLength(1);
  });
});
