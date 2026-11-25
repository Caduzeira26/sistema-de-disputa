import { describe, expect, it } from "vitest";
import { generateSingleElimination, seedOrderForElimination } from "./singleElimination";

/** Primeira rodada real: pares que se enfrentam e quem folga, em número de cabeça de chave. */
function firstRound(n: number) {
  const ranked = Array.from({ length: n }, (_, i) => `T${i + 1}`);
  const ordered = seedOrderForElimination(ranked);
  const { matches } = generateSingleElimination(ordered.map((id, i) => ({ id, seed: i + 1 })));
  const seed = (id: string | null) => (id ? Number(id.slice(1)) : null);
  const pairs = matches
    .filter((m) => m.homeTeamId && m.awayTeamId)
    .map((m) => [seed(m.homeTeamId)!, seed(m.awayTeamId)!].sort((a, b) => a - b));
  const playing = new Set(pairs.flat());
  const byes = ranked.map((_, i) => i + 1).filter((s) => !playing.has(s));
  return { pairs: pairs.sort((a, b) => a[0] - b[0]), byes, matches, ordered };
}

describe("seedOrderForElimination", () => {
  it("with 7 qualifiers the 1st gets the bye and the others play 2x7, 3x6, 4x5", () => {
    const { pairs, byes } = firstRound(7);
    expect(byes).toEqual([1]);
    expect(pairs).toEqual([
      [2, 7],
      [3, 6],
      [4, 5],
    ]);
  });

  it("with 7 qualifiers the 1st meets the winner of 4x5 in the semifinal", () => {
    const { matches, ordered } = firstRound(7);
    const m45 = matches.find((m) => [m.homeTeamId, m.awayTeamId].sort().join() === ["T4", "T5"].join())!;
    const semi = matches.find((m) => m.id === m45.winnerNextMatchId)!;
    expect([semi.homeTeamId, semi.awayTeamId]).toContain("T1");
    expect(ordered).toHaveLength(7);
  });

  it("with 8 qualifiers plays 1x8, 2x7, 3x6, 4x5 and keeps 1 and 2 apart until the final", () => {
    const { pairs, byes, matches } = firstRound(8);
    expect(byes).toEqual([]);
    expect(pairs).toEqual([
      [1, 8],
      [2, 7],
      [3, 6],
      [4, 5],
    ]);
    const nextOf = (a: string) => matches.find((m) => m.homeTeamId === a || m.awayTeamId === a)!.winnerNextMatchId;
    const semiOf1 = matches.find((m) => m.id === nextOf("T1"))!.winnerNextMatchId;
    const semiOf2 = matches.find((m) => m.id === nextOf("T2"))!.winnerNextMatchId;
    expect(nextOf("T1")).not.toBe(nextOf("T2"));
    expect(semiOf1).toBe(semiOf2); // só se encontram na final
  });

  it("with 6 qualifiers the top two get the byes", () => {
    const { pairs, byes } = firstRound(6);
    expect(byes).toEqual([1, 2]);
    expect(pairs).toEqual([
      [3, 6],
      [4, 5],
    ]);
  });

  it("keeps 2 qualifiers as they are", () => {
    expect(seedOrderForElimination(["A", "B"])).toEqual(["A", "B"]);
  });
});
