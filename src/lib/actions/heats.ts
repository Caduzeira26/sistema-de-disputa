"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  createSingleHeat,
  finishHeatsTournament,
  generateNextHeatRound,
  reopenHeat,
  reopenHeatsTournament,
  saveHeat,
} from "@/lib/services/heats";

async function requireOwnedTournament(tournamentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.organizerId !== session.user.id) throw new Error("Torneio não encontrado.");
  return tournament;
}

async function requireOwnedHeat(roundId: string) {
  const round = await prisma.lobbyRound.findUnique({ where: { id: roundId } });
  if (!round) throw new Error("Bateria não encontrada.");
  const tournament = await requireOwnedTournament(round.tournamentId);
  return { round, tournament };
}

function revalidateHeats(tournamentId: string, slug: string) {
  revalidatePath(`/admin/torneios/${tournamentId}`);
  revalidatePath(`/torneios/${slug}`);
}

export type HeatActionState = { error?: string };

export async function createSingleHeatAction(_prev: HeatActionState, formData: FormData): Promise<HeatActionState> {
  const tournamentId = formData.get("tournamentId") as string;
  try {
    const tournament = await requireOwnedTournament(tournamentId);
    await createSingleHeat(tournamentId);
    revalidateHeats(tournamentId, tournament.slug);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível criar a bateria." };
  }
}

export async function saveHeatAction(_prev: HeatActionState, formData: FormData): Promise<HeatActionState> {
  const roundId = formData.get("roundId") as string;
  try {
    const { round, tournament } = await requireOwnedHeat(roundId);
    const scores = formData.getAll("teamId").map(String).map((teamId) => ({
      teamId,
      score: Number(formData.get(`score_${teamId}`)),
    }));
    await saveHeat(roundId, scores);
    revalidateHeats(round.tournamentId, tournament.slug);
    revalidatePath(`/admin/torneios/${round.tournamentId}/quedas/${roundId}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar a bateria." };
  }
}

export async function reopenHeatAction(formData: FormData): Promise<void> {
  const roundId = formData.get("roundId") as string;
  const { round, tournament } = await requireOwnedHeat(roundId);
  await reopenHeat(roundId);
  revalidateHeats(round.tournamentId, tournament.slug);
  revalidatePath(`/admin/torneios/${round.tournamentId}/quedas/${roundId}`);
}

export async function generateNextHeatRoundAction(_prev: HeatActionState, formData: FormData): Promise<HeatActionState> {
  const tournamentId = formData.get("tournamentId") as string;
  try {
    const tournament = await requireOwnedTournament(tournamentId);
    await generateNextHeatRound(tournamentId);
    revalidateHeats(tournamentId, tournament.slug);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível gerar a próxima rodada." };
  }
}

export async function finishHeatsTournamentAction(_prev: HeatActionState, formData: FormData): Promise<HeatActionState> {
  const tournamentId = formData.get("tournamentId") as string;
  try {
    const tournament = await requireOwnedTournament(tournamentId);
    await finishHeatsTournament(tournamentId);
    revalidateHeats(tournamentId, tournament.slug);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível encerrar o campeonato." };
  }
}

export async function reopenHeatsTournamentAction(formData: FormData): Promise<void> {
  const tournamentId = formData.get("tournamentId") as string;
  const tournament = await requireOwnedTournament(tournamentId);
  await reopenHeatsTournament(tournamentId);
  revalidateHeats(tournamentId, tournament.slug);
}
