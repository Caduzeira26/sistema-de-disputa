import { describe, expect, it } from "vitest";
import { generateGroupStage, generateRoundRobin, splitIntoGroups } from "./groups";
import type { TeamInput } from "./types";

function teams(n: number): TeamInput[] {
  return Array.from({ length: n }, (_, i) => ({ id: `T${i + 1}`, seed: i + 1 }));
}

describe("splitIntoGroups", () => {
  it("distributes teams evenly across groups using snake seeding", () => {
    const groups = splitIntoGroups(teams(8), 2);
    expect(groups).toHaveLength(2);
    expect(groups[0].map((t) => t.id)).toEqual(["T1", "T4", "T5", "T8"]);
    expect(groups[1].map((t) => t.id)).toEqual(["T2", "T3", "T6", "T7"]);
  });

  it("handles a team count that doesn't divide evenly", () => {
    const groups = splitIntoGroups(teams(7), 2);
    const sizes = groups.map((g) => g.length).sort();
    expect(sizes).toEqual([3, 4]);
    expect(groups.flat()).toHaveLength(7);
  });
});

describe("generateRoundRobin", () => {
  it.each([2, 3, 4, 5, 6, 7])("every team plays every other team exactly once (%i teams)", (n) => {
    const ids = Array.from({ length: n }, (_, i) => `T${i + 1}`);
    const fixtures = generateRoundRobin(ids);

    expect(fixtures).toHaveLength((n * (n - 1)) / 2);

    const seenPairs = new Set<string>();
    for (const f of fixtures) {
      expect(f.home).not.toBe(f.away);
      const key = [f.home, f.away].sort().join("-");
      expect(seenPairs.has(key)).toBe(false);
      seenPairs.add(key);
    }
    expect(seenPairs.size).toBe((n * (n - 1)) / 2);

    for (const id of ids) {
      const appearances = fixtures.filter((f) => f.home === id || f.away === id);
      expect(appearances).toHaveLength(n - 1);
    }
  });

  it("returns nothing for fewer than 2 teams", () => {
    expect(generateRoundRobin(["T1"])).toEqual([]);
    expect(generateRoundRobin([])).toEqual([]);
  });
});

describe("generateGroupStage", () => {
  it("produces only GROUP matches, each tagged with its group", () => {
    const { groups, matches } = generateGroupStage(teams(8), 2);
    expect(groups).toHaveLength(2);
    expect(matches.every((m) => m.bracket === "GROUP")).toBe(true);
    expect(matches.every((m) => m.groupId !== null)).toBe(true);

    for (const group of groups) {
      const groupMatches = matches.filter((m) => m.groupId === group.id);
      expect(groupMatches).toHaveLength((group.teamIds.length * (group.teamIds.length - 1)) / 2);
      for (const m of groupMatches) {
        expect(group.teamIds).toContain(m.homeTeamId);
        expect(group.teamIds).toContain(m.awayTeamId);
      }
    }
  });
});
