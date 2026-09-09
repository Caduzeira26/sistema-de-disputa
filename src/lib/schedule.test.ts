import { describe, expect, it } from "vitest";
import { distributeSchedule } from "./schedule";

describe("distributeSchedule", () => {
  it("places `gamesPerDay` matches per day, `intervalMinutes` apart, then rolls to the next day", () => {
    const ids = ["m1", "m2", "m3", "m4", "m5"];
    const result = distributeSchedule(ids, {
      startDate: "2026-04-10",
      startTime: "09:00",
      gamesPerDay: 2,
      intervalMinutes: 90,
      venueIds: [],
    });

    expect(result.map((r) => r.scheduledAt.toISOString())).toEqual([
      new Date(2026, 3, 10, 9, 0).toISOString(),
      new Date(2026, 3, 10, 10, 30).toISOString(),
      new Date(2026, 3, 11, 9, 0).toISOString(),
      new Date(2026, 3, 11, 10, 30).toISOString(),
      new Date(2026, 3, 12, 9, 0).toISOString(),
    ]);
  });

  it("cycles through venues round-robin", () => {
    const ids = ["m1", "m2", "m3", "m4"];
    const result = distributeSchedule(ids, {
      startDate: "2026-04-10",
      startTime: "09:00",
      gamesPerDay: 4,
      intervalMinutes: 60,
      venueIds: ["Q1", "Q2"],
    });
    expect(result.map((r) => r.venueId)).toEqual(["Q1", "Q2", "Q1", "Q2"]);
  });

  it("assigns no venue when none are configured", () => {
    const result = distributeSchedule(["m1"], {
      startDate: "2026-04-10",
      startTime: "09:00",
      gamesPerDay: 1,
      intervalMinutes: 60,
      venueIds: [],
    });
    expect(result[0].venueId).toBeNull();
  });

  it("preserves the input order and match ids", () => {
    const ids = ["a", "b", "c"];
    const result = distributeSchedule(ids, {
      startDate: "2026-01-01",
      startTime: "08:00",
      gamesPerDay: 1,
      intervalMinutes: 30,
      venueIds: [],
    });
    expect(result.map((r) => r.matchId)).toEqual(ids);
  });

  it("rejects invalid config", () => {
    expect(() =>
      distributeSchedule(["a"], { startDate: "2026-01-01", startTime: "08:00", gamesPerDay: 0, intervalMinutes: 30, venueIds: [] })
    ).toThrow();
    expect(() =>
      distributeSchedule(["a"], { startDate: "2026-01-01", startTime: "08:00", gamesPerDay: 1, intervalMinutes: -1, venueIds: [] })
    ).toThrow();
    expect(() =>
      distributeSchedule(["a"], { startDate: "not-a-date", startTime: "08:00", gamesPerDay: 1, intervalMinutes: 30, venueIds: [] })
    ).toThrow();
  });
});
