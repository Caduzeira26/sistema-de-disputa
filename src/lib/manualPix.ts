import { z } from "zod";

export const MANUAL_PIX_KEY_MAX_LENGTH = 300;
export const MANUAL_PIX_HOLDER_MAX_LENGTH = 100;

/**
 * "25", "25,50" or "1.250,00" → cents. Empty → null (no amount shown).
 * Returns undefined when the text isn't a valid non-negative amount.
 */
export function parseReaisToCents(text: string | null | undefined): number | null | undefined {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  const text0 = trimmed.replace(/\s/g, "").replace(/^R\$/i, "");
  let normalized: string;
  if (text0.includes(",")) {
    // Brazilian format: dots group thousands, the comma is the decimal separator.
    normalized = text0.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text0)) {
    normalized = text0.replace(/\./g, ""); // "1.250" → 1250
  } else {
    normalized = text0; // "25" or "25.50"
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return undefined;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isFinite(cents) ? cents : undefined;
}

export const manualPixSchema = z.object({
  key: z.string().trim().max(MANUAL_PIX_KEY_MAX_LENGTH, "A chave PIX é longa demais."),
  holder: z.string().trim().max(MANUAL_PIX_HOLDER_MAX_LENGTH, "O nome do favorecido é longo demais."),
  amount: z.string().optional(),
});

export type ManualPixSettings = { key: string; holder: string | null; amountCents: number | null };

/**
 * What the tournament page should show, or null when no manual PIX key is set.
 * When a manual key is set it replaces the automatic (Efí) charge; the amount
 * shown falls back to the tournament's registration fee so it doesn't have to
 * be typed twice.
 */
export function manualPixFromTournament(t: {
  manualPixKey: string | null;
  manualPixHolder: string | null;
  manualPixAmountCents: number | null;
  registrationFeeCents?: number | null;
}): ManualPixSettings | null {
  if (!t.manualPixKey) return null;
  return {
    key: t.manualPixKey,
    holder: t.manualPixHolder,
    amountCents: t.manualPixAmountCents ?? (t.registrationFeeCents || null),
  };
}
