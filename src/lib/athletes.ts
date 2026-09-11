import { prisma } from "@/lib/db";
import type { Tournament } from "@prisma/client";

/**
 * Reuses the existing Athlete for a CPF that's already registered somewhere
 * (any tournament), so the same person keeps one identity across events.
 * No document = always a fresh Athlete — this is what keeps non-Liga
 * tournaments working exactly as before, just with an Athlete row underneath.
 */
export async function findOrCreateAthlete(params: {
  name: string;
  document?: string | null;
  birthDate?: Date | null;
}) {
  if (params.document) {
    const existing = await prisma.athlete.findUnique({ where: { document: params.document } });
    if (existing) return existing;
  }

  return prisma.athlete.create({
    data: { name: params.name, document: params.document || null, birthDate: params.birthDate ?? null },
  });
}

/** No deadline configured = always open; otherwise open strictly before the deadline. */
export function isTransferWindowOpen(tournament: Pick<Tournament, "transferDeadline">, now = new Date()): boolean {
  return !tournament.transferDeadline || now < tournament.transferDeadline;
}

/** The athlete's current roster slot within a tournament, if any (across whichever team). */
export async function getAthleteCurrentPlayer(athleteId: string, tournamentId: string) {
  return prisma.player.findFirst({
    where: { athleteId, active: true, team: { tournamentId } },
    include: { team: true },
  });
}

/** Normalizes a CPF-ish input to digits only, for storage/lookup consistency. */
export function normalizeDocument(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidDocumentFormat(raw: string): boolean {
  return normalizeDocument(raw).length === 11;
}
