import { prisma } from "@/lib/db";
import { distributeSchedule, type ScheduleConfig } from "@/lib/schedule";

const BRACKET_ORDER: Record<string, number> = { GROUP: 0, WINNERS: 1, LOSERS: 1, GRAND_FINAL: 2 };

export async function autoDistributeSchedule(
  tournamentId: string,
  config: Omit<ScheduleConfig, "venueIds"> & { venueIds?: string[] }
): Promise<void> {
  const matches = await prisma.match.findMany({ where: { tournamentId } });
  if (matches.length === 0) {
    throw new Error("Este torneio ainda não tem partidas geradas.");
  }

  const ordered = [...matches].sort((a, b) => {
    const rankA = BRACKET_ORDER[a.bracket] ?? 9;
    const rankB = BRACKET_ORDER[b.bracket] ?? 9;
    if (rankA !== rankB) return rankA - rankB;
    if (a.round !== b.round) return a.round - b.round;
    return a.position - b.position;
  });

  const venueIds = config.venueIds ?? [];
  const assignments = distributeSchedule(
    ordered.map((m) => m.id),
    { ...config, venueIds }
  );

  await prisma.$transaction(
    assignments.map((a) =>
      prisma.match.update({
        where: { id: a.matchId },
        data: { scheduledAt: a.scheduledAt, venueId: a.venueId },
      })
    )
  );
}

export async function updateMatchSchedule(
  matchId: string,
  scheduledAt: Date | null,
  venueId: string | null
): Promise<void> {
  await prisma.match.update({ where: { id: matchId }, data: { scheduledAt, venueId } });
}

export async function addVenue(tournamentId: string, name: string): Promise<void> {
  await prisma.venue.create({ data: { tournamentId, name } });
}

export async function deleteVenue(venueId: string): Promise<void> {
  await prisma.venue.delete({ where: { id: venueId } });
}
