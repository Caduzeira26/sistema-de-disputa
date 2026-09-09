"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { autoDistributeSchedule, updateMatchSchedule, addVenue, deleteVenue } from "@/lib/services/schedule";

async function requireOwnedTournament(tournamentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.organizerId !== session.user.id) {
    throw new Error("Torneio não encontrado.");
  }
  return tournament;
}

async function requireOwnedVenue(venueId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const venue = await prisma.venue.findUnique({ where: { id: venueId }, include: { tournament: true } });
  if (!venue || venue.tournament.organizerId !== session.user.id) {
    throw new Error("Local não encontrado.");
  }
  return venue;
}

async function requireOwnedMatch(matchId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { tournament: true } });
  if (!match || match.tournament.organizerId !== session.user.id) {
    throw new Error("Partida não encontrada.");
  }
  return match;
}

export type ActionState = { error?: string };

const autoScheduleSchema = z.object({
  tournamentId: z.string().min(1),
  startDate: z.string().min(1, "Informe a data inicial"),
  startTime: z.string().min(1, "Informe o horário"),
  gamesPerDay: z.coerce.number().int().min(1, "Deve ser pelo menos 1"),
  intervalMinutes: z.coerce.number().int().min(0),
});

export async function autoDistributeScheduleAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = autoScheduleSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    startDate: formData.get("startDate"),
    startTime: formData.get("startTime"),
    gamesPerDay: formData.get("gamesPerDay"),
    intervalMinutes: formData.get("intervalMinutes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await requireOwnedTournament(parsed.data.tournamentId);
    const venueIds = formData.getAll("venueIds").map(String).filter(Boolean);
    await autoDistributeSchedule(parsed.data.tournamentId, {
      startDate: parsed.data.startDate,
      startTime: parsed.data.startTime,
      gamesPerDay: parsed.data.gamesPerDay,
      intervalMinutes: parsed.data.intervalMinutes,
      venueIds,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível distribuir a agenda." };
  }

  revalidatePath(`/admin/torneios/${parsed.data.tournamentId}/agenda`);
  revalidatePath(`/torneios`);
  return {};
}

const matchScheduleSchema = z.object({
  matchId: z.string().min(1),
  date: z.string().optional(),
  time: z.string().optional(),
  venueId: z.string().optional(),
});

export async function updateMatchScheduleAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = matchScheduleSchema.safeParse({
    matchId: formData.get("matchId"),
    date: formData.get("date"),
    time: formData.get("time"),
    venueId: formData.get("venueId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    let scheduledAt: Date | null = null;
    if (parsed.data.date && parsed.data.time) {
      const [year, month, day] = parsed.data.date.split("-").map(Number);
      const [hour, minute] = parsed.data.time.split(":").map(Number);
      scheduledAt = new Date(year, month - 1, day, hour, minute);
    }
    await updateMatchSchedule(parsed.data.matchId, scheduledAt, parsed.data.venueId || null);
    revalidatePath(`/admin/torneios/${match.tournamentId}/agenda`);
    revalidatePath(`/torneios`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar." };
  }
  return {};
}

const addVenueSchema = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(1, "Informe o nome do local"),
});

export async function addVenueAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = addVenueSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  try {
    await requireOwnedTournament(parsed.data.tournamentId);
    await addVenue(parsed.data.tournamentId, parsed.data.name);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível adicionar o local." };
  }
  revalidatePath(`/admin/torneios/${parsed.data.tournamentId}/agenda`);
  return {};
}

export async function deleteVenueAction(formData: FormData): Promise<void> {
  const venueId = formData.get("venueId") as string;
  const venue = await requireOwnedVenue(venueId);
  await deleteVenue(venueId);
  revalidatePath(`/admin/torneios/${venue.tournamentId}/agenda`);
}
