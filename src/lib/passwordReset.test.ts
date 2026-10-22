import { describe, expect, it } from "vitest";
import {
  RESET_REQUEST_COOLDOWN_MS,
  generateResetToken,
  hashResetToken,
  isResetTokenUsable,
  isWithinResetCooldown,
} from "./passwordReset";

describe("generateResetToken", () => {
  it("returns a token whose stored hash matches hashResetToken", () => {
    const { token, tokenHash } = generateResetToken();
    expect(hashResetToken(token)).toBe(tokenHash);
  });

  it("never stores the raw token as its own hash", () => {
    const { token, tokenHash } = generateResetToken();
    expect(tokenHash).not.toBe(token);
  });

  it("generates a different token each time", () => {
    expect(generateResetToken().token).not.toBe(generateResetToken().token);
  });
});

describe("isResetTokenUsable", () => {
  const now = new Date("2026-10-22T12:00:00Z");

  it("accepts an unused token before it expires", () => {
    expect(isResetTokenUsable({ expiresAt: new Date("2026-10-22T12:30:00Z"), usedAt: null }, now)).toBe(true);
  });

  it("rejects an expired token", () => {
    expect(isResetTokenUsable({ expiresAt: new Date("2026-10-22T11:59:59Z"), usedAt: null }, now)).toBe(false);
    expect(isResetTokenUsable({ expiresAt: now, usedAt: null }, now)).toBe(false);
  });

  it("rejects a token that was already used", () => {
    expect(
      isResetTokenUsable({ expiresAt: new Date("2026-10-22T12:30:00Z"), usedAt: new Date("2026-10-22T11:00:00Z") }, now)
    ).toBe(false);
  });
});

describe("isWithinResetCooldown", () => {
  const now = new Date("2026-10-22T12:00:00Z");

  it("is false when no reset was ever requested", () => {
    expect(isWithinResetCooldown(null, now)).toBe(false);
  });

  it("is true right after a request", () => {
    expect(isWithinResetCooldown(new Date(now.getTime() - 10_000), now)).toBe(true);
  });

  it("is false once the cooldown has passed", () => {
    expect(isWithinResetCooldown(new Date(now.getTime() - RESET_REQUEST_COOLDOWN_MS), now)).toBe(false);
  });
});
