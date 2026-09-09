import { describe, expect, it } from "vitest";
import { applyMatchResult, type MatchRecord } from "./advance";

function baseMatch(overrides: Partial<MatchRecord> = {}): MatchRecord {
  return {
    id: "M1",
    bracket: "WINNERS",
    homeTeamId: "A",
    awayTeamId: "B",
    winnerNextMatchId: null,
    winnerNextSlot: null,
    loserNextMatchId: null,
    loserNextSlot: null,
    isReset: false,
    ...overrides,
  };
}

describe("applyMatchResult — validation", () => {
  it("rejects a draw", () => {
    expect(() => applyMatchResult(baseMatch(), 1, 1, [])).toThrow(/draw/);
  });

  it("rejects a match without both teams assigned", () => {
    expect(() => applyMatchResult(baseMatch({ awayTeamId: null }), 1, 0, [])).toThrow();
  });

  it("rejects group-stage matches", () => {
    expect(() => applyMatchResult(baseMatch({ bracket: "GROUP" }), 1, 0, [])).toThrow(/group/i);
  });
});

describe("applyMatchResult — winners bracket", () => {
  it("advances the winner via winnerNextMatchId/Slot", () => {
    const m = baseMatch({ winnerNextMatchId: "M2", winnerNextSlot: "AWAY" });
    const outcome = applyMatchResult(m, 2, 1, []);
    expect(outcome.winnerTeamId).toBe("A");
    expect(outcome.loserTeamId).toBe("B");
    expect(outcome.slotUpdates).toEqual([{ matchId: "M2", slot: "AWAY", teamId: "A" }]);
    expect(outcome.championTeamId).toBeNull();
  });

  it("declares the winner champion when there's nowhere left to advance to (single-elimination final)", () => {
    const m = baseMatch();
    const outcome = applyMatchResult(m, 0, 3, []);
    expect(outcome.winnerTeamId).toBe("B");
    expect(outcome.championTeamId).toBe("B");
    expect(outcome.slotUpdates).toEqual([]);
  });
});

describe("applyMatchResult — losers bracket drop", () => {
  it("sends the loser to loserNextMatchId/Slot in addition to advancing the winner", () => {
    const m = baseMatch({
      winnerNextMatchId: "WB2",
      winnerNextSlot: "HOME",
      loserNextMatchId: "LB1",
      loserNextSlot: "AWAY",
    });
    const outcome = applyMatchResult(m, 3, 1, []);
    expect(outcome.slotUpdates).toEqual(
      expect.arrayContaining([
        { matchId: "WB2", slot: "HOME", teamId: "A" },
        { matchId: "LB1", slot: "AWAY", teamId: "B" },
      ])
    );
  });

  it("a losers-bracket match has no loserNextMatchId — losing it is elimination", () => {
    const m = baseMatch({ bracket: "LOSERS", winnerNextMatchId: "LB2", winnerNextSlot: "HOME" });
    const outcome = applyMatchResult(m, 1, 4, []);
    expect(outcome.slotUpdates).toEqual([{ matchId: "LB2", slot: "HOME", teamId: "B" }]);
  });
});

describe("applyMatchResult — grand final and reset", () => {
  const gf = () => baseMatch({ id: "GF-1", bracket: "GRAND_FINAL", homeTeamId: "WBC", awayTeamId: "LBC" });
  const reset = () => baseMatch({ id: "GF-2", bracket: "GRAND_FINAL", isReset: true, homeTeamId: null, awayTeamId: null });

  it("crowns the winners-bracket finalist champion outright when they win game 1", () => {
    const outcome = applyMatchResult(gf(), 2, 0, [gf(), reset()]);
    expect(outcome.championTeamId).toBe("WBC");
    expect(outcome.resetActivated).toBe(false);
    expect(outcome.slotUpdates).toEqual([]);
  });

  it("activates the reset when the losers-bracket finalist wins game 1", () => {
    const outcome = applyMatchResult(gf(), 0, 2, [gf(), reset()]);
    expect(outcome.championTeamId).toBeNull();
    expect(outcome.resetActivated).toBe(true);
    expect(outcome.slotUpdates).toEqual(
      expect.arrayContaining([
        { matchId: "GF-2", slot: "HOME", teamId: "WBC" },
        { matchId: "GF-2", slot: "AWAY", teamId: "LBC" },
      ])
    );
  });

  it("throws if the reset match can't be found", () => {
    expect(() => applyMatchResult(gf(), 0, 2, [gf()])).toThrow(/reset/i);
  });

  it("the reset match's winner is champion regardless of home/away", () => {
    const populatedReset = baseMatch({ id: "GF-2", bracket: "GRAND_FINAL", isReset: true, homeTeamId: "WBC", awayTeamId: "LBC" });
    const outcome = applyMatchResult(populatedReset, 1, 3, []);
    expect(outcome.championTeamId).toBe("LBC");
  });
});
