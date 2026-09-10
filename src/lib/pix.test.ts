import { describe, expect, it } from "vitest";
import { computeSubscriptionActivation, shouldSettle } from "./pix";

describe("shouldSettle", () => {
  it("settles a pending transaction Efí reports as concluded", () => {
    expect(shouldSettle("PENDING", "CONCLUIDA")).toBe(true);
  });

  it("does not settle a pending transaction Efí still reports as open", () => {
    expect(shouldSettle("PENDING", "ATIVA")).toBe(false);
  });

  it("never re-settles an already-paid transaction, even if Efí says CONCLUIDA again", () => {
    expect(shouldSettle("PAID", "CONCLUIDA")).toBe(false);
  });
});

describe("computeSubscriptionActivation", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("gives a monthly subscription a 30-day window", () => {
    const { startDate, endDate } = computeSubscriptionActivation("MONTHLY", now);
    expect(startDate).toEqual(now);
    expect(endDate).toEqual(new Date("2026-01-31T00:00:00Z"));
  });

  it("gives a per-tournament (avulso) subscription no expiry", () => {
    const { startDate, endDate } = computeSubscriptionActivation("PER_TOURNAMENT", now);
    expect(startDate).toEqual(now);
    expect(endDate).toBeNull();
  });
});
