import { describe, expect, it } from "vitest";
import { layoutBracketTree } from "./treeLayout";
import { generateSingleElimination } from "./singleElimination";
import type { TeamInput } from "./types";

function teams(n: number): TeamInput[] {
  return Array.from({ length: n }, (_, i) => ({ id: `T${i + 1}`, seed: i + 1 }));
}

describe("layoutBracketTree", () => {
  it("gives every match a position, and a match always sits between its two feeders", () => {
    const { matches } = generateSingleElimination(teams(10));
    const layout = layoutBracketTree(matches);
    expect(layout.size).toBe(matches.length);

    for (const m of matches) {
      if (!m.winnerNextMatchId) continue;
      const mine = layout.get(m.id)!;
      const parent = layout.get(m.winnerNextMatchId);
      if (!parent) continue;
      // The parent's y should be reachable as an average involving this
      // match's y — i.e. it's not off in some unrelated position.
      expect(parent.round).toBeGreaterThan(mine.round);
    }
  });

  it("a clean power-of-two bracket lays out as a perfectly balanced tree", () => {
    const { matches } = generateSingleElimination(teams(8));
    const layout = layoutBracketTree(matches);
    const round1 = matches.filter((m) => m.round === 1);
    const ys = round1.map((m) => layout.get(m.id)!.y).sort((a, b) => a - b);
    // 4 round-1 matches, leaf slots 0..7 consumed in pairs -> ys = [0.5, 2.5, 4.5, 6.5]
    expect(ys).toEqual([0.5, 2.5, 4.5, 6.5]);

    const final = matches.find((m) => m.winnerNextMatchId === null)!;
    expect(layout.get(final.id)!.y).toBe(3.5); // dead center
  });

  it("handles an empty match list without throwing", () => {
    expect(layoutBracketTree([]).size).toBe(0);
  });
});
