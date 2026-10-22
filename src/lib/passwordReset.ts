import { createHash, randomBytes } from "node:crypto";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
/** Minimum gap between two reset e-mails for the same account, so the form can't be used to spam an inbox. */
export const RESET_REQUEST_COOLDOWN_MS = 60 * 1000;

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

export function isResetTokenUsable(
  record: { expiresAt: Date; usedAt: Date | null },
  now = new Date()
): boolean {
  return record.usedAt === null && now < record.expiresAt;
}

export function isWithinResetCooldown(lastCreatedAt: Date | null, now = new Date()): boolean {
  return lastCreatedAt !== null && now.getTime() - lastCreatedAt.getTime() < RESET_REQUEST_COOLDOWN_MS;
}
