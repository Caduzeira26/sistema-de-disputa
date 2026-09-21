import { describe, expect, it } from "vitest";
import { generateDoubleElimination, GRAND_FINAL_ID, GRAND_FINAL_RESET_ID } from "./doubleElimination";
import { applyMatchResult, type MatchRecord } from "./advance";
import { simulateBracket } from "./testUtils";
import type { GeneratedMatch, TeamInput } from "./types";

function teams(n: number): TeamInput[] {
  return Array.from({ length: n }, (_, i) => ({ id: `T${i + 1}`, seed: i + 1 }));
}

function find(matches: GeneratedMatch[], id: string) {
  const m = matches.find((mm) => mm.id === id);
  if (!m) throw new Error(`match ${id} not found`);
  return m;
}

function asRecord(m: GeneratedMatch): MatchRecord {
  return {
    id: m.id,
    bracket: m.bracket,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    winnerNextMatchId: m.winnerNextMatchId,
    winnerNextSlot: m.winnerNextSlot,
    loserNextMatchId: m.loserNextMatchId,
    loserNextSlot: m.loserNextSlot,
    isReset: m.isReset,
  };
}

describe("generateDoubleElimination — structure", () => {
  it("always creates a grand final and a (initially empty) reset match", () => {
    for (const n of [2, 3, 4, 5, 8, 9]) {
      const { matches } = generateDoubleElimination(teams(n));
      const gf = find(matches, GRAND_FINAL_ID);
      const reset = find(matches, GRAND_FINAL_RESET_ID);
      expect(gf.bracket).toBe("GRAND_FINAL");
      expect(gf.isReset).toBe(false);
      expect(reset.bracket).toBe("GRAND_FINAL");
      expect(reset.isReset).toBe(true);
      expect(reset.homeTeamId).toBeNull();
      expect(reset.awayTeamId).toBeNull();
    }
  });

  it("wires the winners-bracket final's winner into the grand final HOME slot", () => {
    const { matches } = generateDoubleElimination(teams(8));
    const wbFinal = matches.find((m) => m.bracket === "WINNERS" && m.round === 3)!;
    expect(wbFinal.winnerNextMatchId).toBe(GRAND_FINAL_ID);
    expect(wbFinal.winnerNextSlot).toBe("HOME");
  });

  it("every winners-bracket match with a real loser feeds the losers bracket, including the final (only its winner reaches the grand final)", () => {
    const { matches } = generateDoubleElimination(teams(8));
    const wbMatches = matches.filter((m) => m.bracket === "WINNERS");
    for (const m of wbMatches) {
      if (m.autoWinnerTeamId) {
        expect(m.loserNextMatchId).toBeNull(); // byes have no loser
        continue;
      }
      expect(m.loserNextMatchId).not.toBeNull();
      const target = find(matches, m.loserNextMatchId!);
      expect(target.bracket).toBe("LOSERS");
    }
  });
});

describe("generateDoubleElimination — full simulation invariants", () => {
  const strategies: Array<[string, (ts: TeamInput[]) => (home: string, away: string) => string]> = [
    [
      "top seed always wins",
      (ts) => (home, away) => {
        const seedOf = (id: string) => ts.find((t) => t.id === id)!.seed;
        return seedOf(home) < seedOf(away) ? home : away;
      },
    ],
    [
      "bottom seed always wins (forces long losers-bracket runs)",
      (ts) => (home, away) => {
        const seedOf = (id: string) => ts.find((t) => t.id === id)!.seed;
        return seedOf(home) > seedOf(away) ? home : away;
      },
    ],
    ["home always wins", () => (home) => home],
    ["away always wins", () => (_home, away) => away],
  ];

  for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 11, 16]) {
    for (const [label, makeStrategy] of strategies) {
      it(`${n} teams, ${label}: exactly one champion with <=1 loss, everyone else eliminated with exactly 2`, () => {
        const ts = teams(n);
        const { matches } = generateDoubleElimination(ts);
        const result = simulateBracket(matches, makeStrategy(ts));

        expect(result.championTeamId).not.toBeNull();
        const championLosses = result.lossCount.get(result.championTeamId!) ?? 0;
        expect(championLosses === 0 || championLosses === 1).toBe(true);

        for (const t of ts) {
          if (t.id === result.championTeamId) continue;
          expect(result.lossCount.get(t.id)).toBe(2);
        }

        // No team should ever be recorded as losing more than twice.
        for (const [, losses] of result.lossCount) {
          expect(losses).toBeLessThanOrEqual(2);
        }

        // Runner-up is the grand final's other finalist; third place is the
        // single team eliminated in the losers-bracket final (there's no
        // such match, hence no third place, when only 2 teams ever play).
        expect(result.runnerUpTeamId).not.toBeNull();
        expect(result.runnerUpTeamId).not.toBe(result.championTeamId);
        expect(result.thirdPlaceTeamIds).toHaveLength(n === 2 ? 0 : 1);
        for (const id of result.thirdPlaceTeamIds) {
          expect(id).not.toBe(result.championTeamId);
          expect(id).not.toBe(result.runnerUpTeamId);
        }
      });
    }
  }
});

describe("generateDoubleElimination — grand final reset, explicit 4-team walkthrough", () => {
  function buildAndReachGrandFinal() {
    const { matches } = generateDoubleElimination(teams(4));
    const byId = new Map(matches.map((m) => [m.id, { ...m }]));
    const play = (id: string, winnerTeamId: string) => {
      const m = byId.get(id)!;
      const home = winnerTeamId === m.homeTeamId;
      const outcome = applyMatchResult(asRecord(m), home ? 1 : 0, home ? 0 : 1, [...byId.values()]);
      for (const u of outcome.slotUpdates) {
        const target = byId.get(u.matchId)!;
        if (u.slot === "HOME") target.homeTeamId = u.teamId;
        else target.awayTeamId = u.teamId;
      }
      return outcome;
    };

    const wb1 = matches.filter((m) => m.bracket === "WINNERS" && m.round === 1);
    // Round-1 pairing for 4 teams (minimal-byes convention, no byes needed
    // since 4 is already a power of two) is (T1,T2) and (T3,T4).
    play(wb1[0].id, "T1"); // T1 beats T2
    play(wb1[1].id, "T3"); // T3 beats T4

    const wbFinal = matches.find((m) => m.bracket === "WINNERS" && m.round === 2)!;
    play(wbFinal.id, "T1"); // T1 wins the winners bracket outright, T3 drops to losers

    const lb1 = matches.find((m) => m.bracket === "LOSERS" && m.round === 1)!;
    play(lb1.id, "T4"); // T4 (lost to T3) beats T2 (lost to T1) — T2 eliminated with 2 losses

    const lb2 = matches.find((m) => m.bracket === "LOSERS" && m.round === 2)!;
    play(lb2.id, "T3"); // T3 (the WB-final loser) beats T4 — T4 eliminated with 2 losses, T3 is LB champion

    return { byId, gf: byId.get(GRAND_FINAL_ID)!, reset: byId.get(GRAND_FINAL_RESET_ID)! };
  }

  it("no reset needed when the winners-bracket finalist wins the grand final outright", () => {
    const { byId, gf } = buildAndReachGrandFinal();
    expect(gf.homeTeamId).toBe("T1");
    expect(gf.awayTeamId).toBe("T3");

    const outcome = applyMatchResult(asRecord(byId.get(GRAND_FINAL_ID)!), 1, 0, [...byId.values()]);
    expect(outcome.championTeamId).toBe("T1");
    expect(outcome.resetActivated).toBe(false);
    expect(outcome.slotUpdates).toHaveLength(0);
  });

  it("triggers the reset when the losers-bracket finalist wins the first grand final game, and the reset decides the champion", () => {
    const { byId, gf } = buildAndReachGrandFinal();

    const gfOutcome = applyMatchResult(asRecord(byId.get(GRAND_FINAL_ID)!), 0, 1, [...byId.values()]);
    expect(gfOutcome.championTeamId).toBeNull();
    expect(gfOutcome.resetActivated).toBe(true);
    expect(gfOutcome.slotUpdates).toEqual(
      expect.arrayContaining([
        { matchId: GRAND_FINAL_RESET_ID, slot: "HOME", teamId: gf.homeTeamId },
        { matchId: GRAND_FINAL_RESET_ID, slot: "AWAY", teamId: gf.awayTeamId },
      ])
    );

    const reset = byId.get(GRAND_FINAL_RESET_ID)!;
    for (const u of gfOutcome.slotUpdates) {
      if (u.slot === "HOME") reset.homeTeamId = u.teamId;
      else reset.awayTeamId = u.teamId;
    }
    expect(reset.homeTeamId).toBe("T1");
    expect(reset.awayTeamId).toBe("T3");

    // T3 (the reset winner) takes the title even though T1 never lost twice
    // before the reset — that's the whole point of the reset match.
    const resetOutcome = applyMatchResult(asRecord(reset), 0, 1, [...byId.values()]);
    expect(resetOutcome.championTeamId).toBe("T3");
  });
});
