"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  createLobbyRounds,
  finishLobbyTournament,
  generateLobbyFinal,
  reopenLobbyRound,
  reopenLobbyTournament,
  saveLobbyRound,
} from "@/lib/services/lobby";

async function requireOwnedTournament(tournamentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.organizerId !== session.user.id) throw new Error("Torneio não encontrado.");
  return tournament;
}

async function requireOwnedRound(roundId: string) {
  const round = await prisma.lobbyRound.findUnique({ where: { id: roundId } });
  if (!round) throw new Error("Queda não encontrada.");
  const tournament = await requireOwnedTournament(round.tournamentId);
  return { round, tournament };
}

function revalidateLobby(tournamentId: string, slug: string) {
  revalidatePath(`/admin/torneios/${tournamentId}`);
  revalidatePath(`/torneios/${slug}`);
}

export type LobbyActionState = { error?: string };

export async function createLobbyRoundsAction(_prev: LobbyActionState, formData: FormData): Promise<LobbyActionState> {
  const tournamentId = formData.get("tournamentId") as string;
  try {
    const tournament = await requireOwnedTournament(tournamentId);
    await createLobbyRounds(tournamentId, Number(formData.get("count")));
    revalidateLobby(tournamentId, tournament.slug);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível criar as quedas." };
  }
}

export async function saveLobbyRoundAction(_prev: LobbyActionState, formData: FormData): Promise<LobbyActionState> {
  const roundId = formData.get("roundId") as string;
  try {
    const { round, tournament } = await requireOwnedRound(roundId);
    const teamIds = formData.getAll("teamId").map(String);
    const entries = teamIds.map((teamId) => ({
      teamId,
      placement: Number(formData.get(`placement_${teamId}`)),
      kills: Number(formData.get(`kills_${teamId}`) || 0),
    }));
    await saveLobbyRound(roundId, entries);
    revalidateLobby(round.tournamentId, tournament.slug);
    revalidatePath(`/admin/torneios/${round.tournamentId}/quedas/${roundId}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar a queda." };
  }
}

export async function reopenLobbyRoundAction(formData: FormData): Promise<void> {
  const roundId = formData.get("roundId") as string;
  const { round, tournament } = await requireOwnedRound(roundId);
  await reopenLobbyRound(roundId);
  revalidateLobby(round.tournamentId, tournament.slug);
  revalidatePath(`/admin/torneios/${round.tournamentId}/quedas/${roundId}`);
}

export async function generateLobbyFinalAction(_prev: LobbyActionState, formData: FormData): Promise<LobbyActionState> {
  const tournamentId = formData.get("tournamentId") as string;
  try {
    const tournament = await requireOwnedTournament(tournamentId);
    await generateLobbyFinal(tournamentId, Number(formData.get("topPerGroup")), Number(formData.get("count")));
    revalidateLobby(tournamentId, tournament.slug);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível gerar a grande final." };
  }
}

export async function finishLobbyTournamentAction(_prev: LobbyActionState, formData: FormData): Promise<LobbyActionState> {
  const tournamentId = formData.get("tournamentId") as string;
  try {
    const tournament = await requireOwnedTournament(tournamentId);
    await finishLobbyTournament(tournamentId);
    revalidateLobby(tournamentId, tournament.slug);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível encerrar o campeonato." };
  }
}

export async function reopenLobbyTournamentAction(formData: FormData): Promise<void> {
  const tournamentId = formData.get("tournamentId") as string;
  const tournament = await requireOwnedTournament(tournamentId);
  await reopenLobbyTournament(tournamentId);
  revalidateLobby(tournamentId, tournament.slug);
}
