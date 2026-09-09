"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { addGoal, removeGoal, addCard, removeCard, reopenMatch } from "@/lib/services/sumula";

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

const goalSchema = z.object({
  matchId: z.string().min(1),
  playerId: z.string().min(1, "Selecione o jogador"),
  teamId: z.string().min(1),
  minute: z.coerce.number().int().min(0).max(200),
});

export async function addGoalAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = goalSchema.safeParse({
    matchId: formData.get("matchId"),
    playerId: formData.get("playerId"),
    teamId: formData.get("teamId"),
    minute: formData.get("minute"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    await addGoal(parsed.data.matchId, parsed.data.playerId, parsed.data.teamId, parsed.data.minute);
    revalidatePath(`/admin/torneios/${match.tournamentId}/partidas/${match.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível registrar o gol." };
  }
  return {};
}

export async function removeGoalAction(formData: FormData): Promise<void> {
  const goalId = formData.get("goalId") as string;
  const goal = await prisma.goal.findUniqueOrThrow({ where: { id: goalId }, include: { match: { include: { tournament: true } } } });
  const session = await auth();
  if (!session?.user || goal.match.tournament.organizerId !== session.user.id) {
    throw new Error("Não autorizado.");
  }
  await removeGoal(goalId);
  revalidatePath(`/admin/torneios/${goal.match.tournamentId}/partidas/${goal.matchId}`);
}

const cardSchema = z.object({
  matchId: z.string().min(1),
  playerId: z.string().min(1, "Selecione o jogador"),
  teamId: z.string().min(1),
  type: z.enum(["YELLOW", "RED"]),
  minute: z.coerce.number().int().min(0).max(200),
});

export async function addCardAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = cardSchema.safeParse({
    matchId: formData.get("matchId"),
    playerId: formData.get("playerId"),
    teamId: formData.get("teamId"),
    type: formData.get("type"),
    minute: formData.get("minute"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    await addCard(parsed.data.matchId, parsed.data.playerId, parsed.data.teamId, parsed.data.type, parsed.data.minute);
    revalidatePath(`/admin/torneios/${match.tournamentId}/partidas/${match.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível registrar o cartão." };
  }
  return {};
}

export async function removeCardAction(formData: FormData): Promise<void> {
  const cardId = formData.get("cardId") as string;
  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId }, include: { match: { include: { tournament: true } } } });
  const session = await auth();
  if (!session?.user || card.match.tournament.organizerId !== session.user.id) {
    throw new Error("Não autorizado.");
  }
  await removeCard(cardId);
  revalidatePath(`/admin/torneios/${card.match.tournamentId}/partidas/${card.matchId}`);
}

export async function reopenMatchAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const matchId = formData.get("matchId") as string;
  try {
    const match = await requireOwnedMatch(matchId);
    await reopenMatch(matchId);
    revalidatePath(`/admin/torneios/${match.tournamentId}/partidas/${match.id}`);
    revalidatePath(`/admin/torneios/${match.tournamentId}`);
    revalidatePath("/torneios");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível reabrir a partida." };
  }
  return {};
}
