import { describe, expect, it } from "vitest";
import { TOURNAMENT_NAME_MAX_LENGTH, tournamentNameSchema } from "./tournamentName";

describe("tournamentNameSchema", () => {
  it("trims surrounding spaces", () => {
    expect(tournamentNameSchema.parse("  Copa Verão  ")).toBe("Copa Verão");
  });

  it("rejects an empty or one-character name", () => {
    expect(tournamentNameSchema.safeParse("   ").success).toBe(false);
    expect(tournamentNameSchema.safeParse("A").success).toBe(false);
  });

  it("rejects a name over the limit", () => {
    expect(tournamentNameSchema.safeParse("x".repeat(TOURNAMENT_NAME_MAX_LENGTH + 1)).success).toBe(false);
    expect(tournamentNameSchema.safeParse("x".repeat(TOURNAMENT_NAME_MAX_LENGTH)).success).toBe(true);
  });
});
