"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GOAL_KINDS, SECRET_CARDS } from "@/lib/kings";
import {
  addKingsGoal,
  addPresidentPenalty,
  addSecretCard,
  finishKingsMatch,
  removeKingsEvent,
  removeKingsGoal,
  setDice,
} from "@/lib/services/kings";

export type KingsActionState = { error?: string };

async function requireOwnedMatch(matchId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { tournament: true } });
  if (!match || match.tournament.organizerId !== session.user.id) throw new Error("Partida não encontrada.");
  return match;
}

function refresh(match: { id: string; tournamentId: string }, all = false) {
  revalidatePath(`/admin/torneios/${match.tournamentId}/partidas/${match.id}`);
  if (all) {
    revalidatePath(`/admin/torneios/${match.tournamentId}`);
    revalidatePath("/torneios");
  }
}

const minute = z.coerce.number({ message: "Informe o minuto." }).int("Minuto inválido.").min(0, "Minuto inválido.");

const goalSchema = z.object({
  matchId: z.string().min(1),
  teamId: z.string().min(1, "Selecione a equipe"),
  playerId: z.string().min(1, "Selecione o jogador"),
  minute,
  kind: z.enum(GOAL_KINDS as [string, ...string[]]),
});

export async function addKingsGoalAction(_prev: KingsActionState, formData: FormData): Promise<KingsActionState> {
  const parsed = goalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    await addKingsGoal({ ...parsed.data, kind: parsed.data.kind as never });
    refresh(match);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível registrar o gol." };
  }
  return {};
}

const cardSchema = z.object({
  matchId: z.string().min(1),
  teamId: z.string().min(1, "Selecione a equipe"),
  card: z.enum(SECRET_CARDS as [string, ...string[]], { message: "Selecione a carta" }),
  minute,
  playerId: z.string().optional(),
  scored: z.string().optional(),
});

export async function addSecretCardAction(_prev: KingsActionState, formData: FormData): Promise<KingsActionState> {
  const parsed = cardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    await addSecretCard({
      matchId: parsed.data.matchId,
      teamId: parsed.data.teamId,
      card: parsed.data.card as never,
      minute: parsed.data.minute,
      playerId: parsed.data.playerId || null,
      scored: parsed.data.scored === "yes",
    });
    refresh(match);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível registrar a carta." };
  }
  return {};
}

const presidentSchema = z.object({
  matchId: z.string().min(1),
  teamId: z.string().min(1, "Selecione a equipe"),
  minute,
  scored: z.enum(["yes", "no"], { message: "Diga se o pênalti foi convertido" }),
});

export async function addPresidentPenaltyAction(_prev: KingsActionState, formData: FormData): Promise<KingsActionState> {
  const parsed = presidentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    await addPresidentPenalty({ ...parsed.data, scored: parsed.data.scored === "yes" });
    refresh(match);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível registrar o pênalti." };
  }
  return {};
}

const diceSchema = z.object({
  matchId: z.string().min(1),
  result: z.coerce.number({ message: "Escolha o resultado do dado" }).int(),
});

export async function setDiceAction(_prev: KingsActionState, formData: FormData): Promise<KingsActionState> {
  const parsed = diceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    await setDice(parsed.data.matchId, parsed.data.result);
    refresh(match);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível registrar o dado." };
  }
  return {};
}

export async function removeKingsEventAction(formData: FormData): Promise<void> {
  const eventId = String(formData.get("eventId") ?? "");
  const event = await prisma.kingsEvent.findUniqueOrThrow({ where: { id: eventId } });
  const match = await requireOwnedMatch(event.matchId);
  await removeKingsEvent(eventId);
  refresh(match);
}

export async function removeKingsGoalAction(formData: FormData): Promise<void> {
  const goalId = String(formData.get("goalId") ?? "");
  const goal = await prisma.goal.findUniqueOrThrow({ where: { id: goalId } });
  const match = await requireOwnedMatch(goal.matchId);
  await removeKingsGoal(goalId);
  refresh(match);
}

const shootoutCount = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().min(0).optional()
);

const finishSchema = z.object({
  matchId: z.string().min(1),
  homeShootouts: shootoutCount,
  awayShootouts: shootoutCount,
});

export async function finishKingsMatchAction(_prev: KingsActionState, formData: FormData): Promise<KingsActionState> {
  const parsed = finishSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { matchId, homeShootouts, awayShootouts } = parsed.data;
  if ((homeShootouts === undefined) !== (awayShootouts === undefined)) {
    return { error: "Informe os shootouts dos dois times." };
  }
  try {
    const match = await requireOwnedMatch(matchId);
    await finishKingsMatch(
      matchId,
      homeShootouts !== undefined && awayShootouts !== undefined ? { home: homeShootouts, away: awayShootouts } : null
    );
    refresh(match, true);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível encerrar a partida." };
  }
  return {};
}
