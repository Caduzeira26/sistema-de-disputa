import { describe, expect, it } from "vitest";
import { applyMatchResult, decidesThirdPlace, type MatchRecord } from "./advance";

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

describe("applyMatchResult — penalty shootout", () => {
  it("lets a level score advance the shootout winner", () => {
    const m = baseMatch({ winnerNextMatchId: "M2", winnerNextSlot: "HOME" });
    const outcome = applyMatchResult(m, 1, 1, [], { home: 3, away: 5 });
    expect(outcome.winnerTeamId).toBe("B");
    expect(outcome.loserTeamId).toBe("A");
    expect(outcome.slotUpdates).toEqual([{ matchId: "M2", slot: "HOME", teamId: "B" }]);
  });

  it("still rejects a level score when the shootout is also level", () => {
    expect(() => applyMatchResult(baseMatch(), 2, 2, [], { home: 4, away: 4 })).toThrow(/draw/);
  });

  it("ignores the shootout when the score already decided the match", () => {
    const outcome = applyMatchResult(baseMatch(), 2, 1, [], { home: 0, away: 9 });
    expect(outcome.winnerTeamId).toBe("A");
  });

  it("crowns the champion by shootout in a single-elimination final", () => {
    const outcome = applyMatchResult(baseMatch(), 0, 0, [], { home: 5, away: 4 });
    expect(outcome.championTeamId).toBe("A");
    expect(outcome.runnerUpTeamId).toBe("B");
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
    expect(outcome.runnerUpTeamId).toBe("A");
    expect(outcome.slotUpdates).toEqual([]);
  });
});

describe("applyMatchResult — third place", () => {
  it("marks a semifinal loser as a bronze-medal contender", () => {
    const final = baseMatch({ id: "FINAL", homeTeamId: "C", awayTeamId: "D" });
    const semifinal = baseMatch({ id: "SF1", winnerNextMatchId: "FINAL", winnerNextSlot: "HOME" });
    const outcome = applyMatchResult(semifinal, 1, 2, [final, semifinal]);
    expect(outcome.thirdPlaceTeamId).toBe("A");
  });

  it("does not mark a double-elimination winners-bracket semifinal loser (they drop to the losers bracket instead)", () => {
    const gf = baseMatch({ id: "GF-1", bracket: "GRAND_FINAL", homeTeamId: null, awayTeamId: null });
    const wbFinal = baseMatch({ id: "WBF", winnerNextMatchId: "GF-1", winnerNextSlot: "HOME" });
    const wbSemi = baseMatch({ id: "WBS", winnerNextMatchId: "WBF", winnerNextSlot: "HOME" });
    const outcome = applyMatchResult(wbSemi, 3, 0, [gf, wbFinal, wbSemi]);
    expect(outcome.thirdPlaceTeamId).toBeNull();
  });

  it("marks the losers-bracket final loser as third place", () => {
    const gf = baseMatch({ id: "GF-1", bracket: "GRAND_FINAL", homeTeamId: null, awayTeamId: null });
    const lbFinal = baseMatch({ id: "LBF", bracket: "LOSERS", winnerNextMatchId: "GF-1", winnerNextSlot: "AWAY" });
    const outcome = applyMatchResult(lbFinal, 1, 3, [gf, lbFinal]);
    expect(outcome.thirdPlaceTeamId).toBe("A");
  });

  it("decidesThirdPlace: false for a match with nowhere to advance to", () => {
    expect(decidesThirdPlace(baseMatch(), [])).toBe(false);
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
    expect(outcome.runnerUpTeamId).toBe("LBC");
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
    expect(outcome.runnerUpTeamId).toBe("WBC");
  });
});
