import { describe, expect, it } from "vitest";
import { isRosterCompletionWindowOpen } from "./roster";

describe("isRosterCompletionWindowOpen", () => {
  it("is open with no start date, as long as the tournament hasn't started", () => {
    expect(isRosterCompletionWindowOpen({ status: "REGISTRATION_OPEN", startDate: null })).toBe(true);
  });

  it("is open strictly before the start date, including the day before", () => {
    const tournament = { status: "REGISTRATION_CLOSED" as const, startDate: new Date("2026-09-20T00:00:00Z") };
    expect(isRosterCompletionWindowOpen(tournament, new Date("2026-09-18T00:00:00Z"))).toBe(true);
    expect(isRosterCompletionWindowOpen(tournament, new Date("2026-09-19T23:59:59Z"))).toBe(true);
  });

  it("is closed at or after the start date", () => {
    const tournament = { status: "REGISTRATION_CLOSED" as const, startDate: new Date("2026-09-20T00:00:00Z") };
    expect(isRosterCompletionWindowOpen(tournament, new Date("2026-09-20T00:00:00Z"))).toBe(false);
    expect(isRosterCompletionWindowOpen(tournament, new Date("2026-09-21T00:00:00Z"))).toBe(false);
  });

  it("is closed once the tournament is in progress, even with no start date", () => {
    expect(isRosterCompletionWindowOpen({ status: "IN_PROGRESS", startDate: null })).toBe(false);
  });

  it("is closed once the tournament is finished, even before the computed cutoff", () => {
    const tournament = { status: "FINISHED" as const, startDate: new Date("2099-01-01T00:00:00Z") };
    expect(isRosterCompletionWindowOpen(tournament)).toBe(false);
  });
});
