import { describe, expect, it } from "vitest";
import { formatTournamentDateRange } from "./formatDateRange";

describe("formatTournamentDateRange", () => {
  it("formats a full range", () => {
    expect(formatTournamentDateRange(new Date("2026-09-09"), new Date("2026-09-15"))).toBe("09/09/2026 a 15/09/2026");
  });

  it("formats only a start date", () => {
    expect(formatTournamentDateRange(new Date("2026-09-09"), null)).toBe("A partir de 09/09/2026");
  });

  it("formats only an end date", () => {
    expect(formatTournamentDateRange(null, new Date("2026-09-15"))).toBe("Até 15/09/2026");
  });

  it("returns null when neither date is set", () => {
    expect(formatTournamentDateRange(null, null)).toBeNull();
  });
});
