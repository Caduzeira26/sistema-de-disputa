import { prisma } from "@/lib/db";
import { distributeSchedule, type ScheduleConfig } from "@/lib/schedule";
import { isByeMatch, topologicalMatchOrder } from "@/lib/bracket/gameOrder";

export async function autoDistributeSchedule(
  tournamentId: string,
  config: Omit<ScheduleConfig, "venueIds"> & { venueIds?: string[] }
): Promise<void> {
  const allMatches = await prisma.match.findMany({ where: { tournamentId } });
  if (allMatches.length === 0) {
    throw new Error("Este torneio ainda não tem partidas geradas.");
  }
  const matches = allMatches.filter((m) => !isByeMatch(m));

  const ordered = topologicalMatchOrder(matches);

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
