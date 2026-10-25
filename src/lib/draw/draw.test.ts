import { describe, expect, it } from "vitest";
import { generateSingleElimination } from "@/lib/bracket";
import {
  buildDrawSteps,
  drawGroups,
  drawKnockout,
  orderQualifiersForBracket,
  resolveDraw,
  resolvePots,
  seededRng,
  shuffle,
  type DrawTeam,
} from "./index";

function teams(count: number, potOf: (i: number) => number | null): DrawTeam[] {
  return Array.from({ length: count }, (_, i) => ({ id: `t${i}`, pot: potOf(i) }));
}

describe("shuffle", () => {
  it("returns a permutation of the same items", () => {
    const result = shuffle([1, 2, 3, 4, 5, 6], seededRng(1));
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("is deterministic for a fixed seed and varies across seeds", () => {
    expect(shuffle([1, 2, 3, 4, 5, 6, 7, 8], seededRng(7))).toEqual(shuffle([1, 2, 3, 4, 5, 6, 7, 8], seededRng(7)));
    const orders = new Set(Array.from({ length: 20 }, (_, s) => shuffle([1, 2, 3, 4, 5, 6], seededRng(s)).join()));
    expect(orders.size).toBeGreaterThan(5);
  });
});

describe("resolvePots", () => {
  it("puts teams without a pot into the last pot", () => {
    const pots = resolvePots([
      { id: "a", pot: 1 },
      { id: "b", pot: 2 },
      { id: "c", pot: null },
    ]);
    expect(pots.get(2)).toEqual(["b", "c"]);
  });

  it("uses pot 1 when nobody has a pot", () => {
    expect([...resolvePots([{ id: "a", pot: null }, { id: "b", pot: null }]).keys()]).toEqual([1]);
  });
});

describe("drawGroups", () => {
  it("never puts two teams of the same pot in one group when pots fit the groups (many seeds)", () => {
    const field = teams(16, (i) => Math.floor(i / 4) + 1); // 4 pots of 4, 4 groups
    for (let seed = 0; seed < 200; seed++) {
      const steps = drawGroups(field, 4, seededRng(seed));
      const seen = new Set<string>();
      for (const s of steps) {
        const key = `${s.groupIndex}-${s.pot}`;
        expect(seen.has(key), `seed ${seed}`).toBe(false);
        seen.add(key);
      }
    }
  });

  it("places every team exactly once and keeps groups even", () => {
    const field = teams(16, (i) => Math.floor(i / 4) + 1);
    const steps = drawGroups(field, 4, seededRng(3));
    expect(new Set(steps.map((s) => s.teamId)).size).toBe(16);
    const sizes = [0, 1, 2, 3].map((g) => steps.filter((s) => s.groupIndex === g).length);
    expect(sizes).toEqual([4, 4, 4, 4]);
  });

  it("reveals pot by pot, best pot first", () => {
    const steps = drawGroups(teams(8, (i) => (i < 4 ? 1 : 2)), 4, seededRng(5));
    expect(steps.slice(0, 4).every((s) => s.pot === 1)).toBe(true);
    expect(steps.slice(4).every((s) => s.pot === 2)).toBe(true);
  });

  it("keeps group sizes within one team when the field doesn't divide evenly", () => {
    for (let seed = 0; seed < 50; seed++) {
      const steps = drawGroups(teams(10, () => null), 3, seededRng(seed));
      const sizes = [0, 1, 2].map((g) => steps.filter((s) => s.groupIndex === g).length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    }
  });

  it("handles a pot bigger than the number of groups", () => {
    const steps = drawGroups(teams(8, () => 1), 2, seededRng(2));
    const sizes = [0, 1].map((g) => steps.filter((s) => s.groupIndex === g).length);
    expect(sizes).toEqual([4, 4]);
  });

  it("rejects more groups than teams", () => {
    expect(() => drawGroups(teams(3, () => null), 4, seededRng(1))).toThrow();
  });

  it("gives the same result for the same seed", () => {
    const field = teams(12, (i) => (i % 3) + 1);
    expect(drawGroups(field, 3, seededRng(11))).toEqual(drawGroups(field, 3, seededRng(11)));
  });
});

describe("drawKnockout", () => {
  it("assigns every team to a unique slot covering 0..n-1, for sizes 2..24", () => {
    for (let n = 2; n <= 24; n++) {
      const steps = drawKnockout(teams(n, (i) => (i < n / 4 ? 1 : i < n / 2 ? 2 : 3)), seededRng(n));
      expect(steps.map((s) => s.slot).sort((a, b) => a! - b!), `n=${n}`).toEqual(Array.from({ length: n }, (_, i) => i));
    }
  });

  it("gives the round-1 byes to the best pot", () => {
    // 10 teams -> 2 byes; the two pot-1 teams must be the ones that skip round 1.
    for (let seed = 0; seed < 50; seed++) {
      const field = teams(10, (i) => (i < 2 ? 1 : 2));
      const steps = drawKnockout(field, seededRng(seed));
      const ordered = resolveDraw("KNOCKOUT", steps, 0).orderedTeamIds;
      const { matches } = generateSingleElimination(ordered.map((id, i) => ({ id, seed: i + 1 })));
      const playing = new Set(matches.filter((m) => m.round === 1).flatMap((m) => [m.homeTeamId, m.awayTeamId]));
      expect(playing.has("t0") || playing.has("t1"), `seed ${seed}`).toBe(false);
    }
  });

  it("makes the top pot face the bottom pot in round 1 (8 teams, 2 pots)", () => {
    for (let seed = 0; seed < 100; seed++) {
      const field = teams(8, (i) => (i < 4 ? 1 : 2));
      const ordered = resolveDraw("KNOCKOUT", drawKnockout(field, seededRng(seed)), 0).orderedTeamIds;
      const { matches } = generateSingleElimination(ordered.map((id, i) => ({ id, seed: i + 1 })));
      for (const m of matches.filter((x) => x.round === 1)) {
        const pots = [m.homeTeamId, m.awayTeamId].map((id) => (Number(id!.slice(1)) < 4 ? 1 : 2)).sort();
        expect(pots, `seed ${seed}`).toEqual([1, 2]);
      }
    }
  });

  it("feeds the bracket builder a valid champion path for odd sizes", () => {
    const field = teams(13, (i) => (i < 4 ? 1 : 2));
    const steps = drawKnockout(field, seededRng(9));
    const ordered = resolveDraw("KNOCKOUT", steps, 0).orderedTeamIds;
    expect(ordered).toHaveLength(13);
    expect(() => generateSingleElimination(ordered.map((id, i) => ({ id, seed: i + 1 })))).not.toThrow();
  });

  it("needs at least 2 teams", () => {
    expect(() => drawKnockout(teams(1, () => null), seededRng(1))).toThrow();
  });
});

describe("buildDrawSteps / resolveDraw", () => {
  it("round-trips a group draw into group membership", () => {
    const field = teams(8, (i) => (i < 4 ? 1 : 2));
    const steps = buildDrawSteps({ kind: "GROUPS", teams: field, numGroups: 2, rng: seededRng(4) });
    const { groups } = resolveDraw("GROUPS", steps, 2);
    expect(groups.flat().sort()).toEqual(field.map((t) => t.id).sort());
    expect(groups.map((g) => g.length)).toEqual([4, 4]);
  });
});

describe("orderQualifiersForBracket", () => {
  const byGroup = (g: number) => Array.from({ length: g }, (_, i) => [`1${String.fromCharCode(65 + i)}`, `2${String.fromCharCode(65 + i)}`]);

  it("crosses 1A x 2B and 1B x 2A for two groups", () => {
    expect(orderQualifiersForBracket(byGroup(2))).toEqual(["1A", "2B", "1B", "2A"]);
  });

  it("splits four groups across the two halves of the bracket", () => {
    expect(orderQualifiersForBracket(byGroup(4))).toEqual(["1A", "2B", "1C", "2D", "1B", "2A", "1D", "2C"]);
  });

  it("never pairs two teams from the same group in round 1, for 2..8 groups", () => {
    for (let g = 2; g <= 8; g++) {
      const ordered = orderQualifiersForBracket(byGroup(g));
      const { matches } = generateSingleElimination(ordered.map((id, i) => ({ id, seed: i + 1 })));
      for (const m of matches.filter((x) => x.round === 1)) {
        expect(m.homeTeamId!.slice(1), `groups=${g}`).not.toBe(m.awayTeamId!.slice(1));
      }
    }
  });

  it("makes every round-1 match a winner against a runner-up when no byes are needed (2, 4, 8 groups)", () => {
    for (const g of [2, 4, 8]) {
      const ordered = orderQualifiersForBracket(byGroup(g));
      const { matches } = generateSingleElimination(ordered.map((id, i) => ({ id, seed: i + 1 })));
      for (const m of matches.filter((x) => x.round === 1)) {
        expect([m.homeTeamId!.charAt(0), m.awayTeamId!.charAt(0)].sort(), `groups=${g}`).toEqual(["1", "2"]);
      }
    }
  });

  it("gives the round-1 byes to group winners when the bracket needs them (3, 5, 6, 7 groups)", () => {
    for (const g of [3, 5, 6, 7]) {
      const ordered = orderQualifiersForBracket(byGroup(g));
      expect(ordered, `groups=${g}`).toHaveLength(g * 2);
      expect(new Set(ordered).size, `groups=${g}`).toBe(g * 2);
      const { matches } = generateSingleElimination(ordered.map((id, i) => ({ id, seed: i + 1 })));
      const playing = new Set(matches.filter((x) => x.round === 1).flatMap((m) => [m.homeTeamId, m.awayTeamId]));
      const byeTeams = ordered.filter((id) => !playing.has(id));
      expect(byeTeams.every((id) => id.startsWith("1")), `groups=${g}`).toBe(true);
    }
  });

  it("keeps the plain order when the qualifier count isn't 2 per group", () => {
    expect(orderQualifiersForBracket([["1A", "2A", "3A"], ["1B", "2B", "3B"]])).toEqual(["1A", "2A", "3A", "1B", "2B", "3B"]);
  });
});
