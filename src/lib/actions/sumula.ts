"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  addGoal,
  removeGoal,
  addCard,
  removeCard,
  addSet,
  removeSet,
  finishSetsMatch,
  addBasket,
  removeBasket,
  addFoul,
  removeFoul,
  finishPeriodsMatch,
  addTableTennisGame,
  removeTableTennisGame,
  addTableTennisSet,
  removeTableTennisSet,
  finishTableTennisMatch,
  reopenMatch,
} from "@/lib/services/sumula";

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

const cardSchema = z
  .object({
    matchId: z.string().min(1),
    playerId: z.string().min(1, "Selecione o jogador"),
    teamId: z.string().min(1),
    type: z.enum(["YELLOW", "RED"]),
    minute: z.coerce.number().int().min(0).max(200).optional(),
    setNumber: z.coerce.number().int().min(1).max(10).optional(),
  })
  .refine((d) => d.minute !== undefined || d.setNumber !== undefined, {
    message: "Informe o minuto ou o set do cartão.",
  });

export async function addCardAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const rawMinute = formData.get("minute");
  const rawSetNumber = formData.get("setNumber");
  const parsed = cardSchema.safeParse({
    matchId: formData.get("matchId"),
    playerId: formData.get("playerId"),
    teamId: formData.get("teamId"),
    type: formData.get("type"),
    minute: rawMinute ? rawMinute : undefined,
    setNumber: rawSetNumber ? rawSetNumber : undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    await addCard(parsed.data);
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

const setSchema = z.object({
  matchId: z.string().min(1),
  setNumber: z.coerce.number().int().min(1).max(10),
  homePoints: z.coerce.number().int().min(0),
  awayPoints: z.coerce.number().int().min(0),
});

export async function addSetAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = setSchema.safeParse({
    matchId: formData.get("matchId"),
    setNumber: formData.get("setNumber"),
    homePoints: formData.get("homePoints"),
    awayPoints: formData.get("awayPoints"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    await addSet(parsed.data.matchId, parsed.data.setNumber, parsed.data.homePoints, parsed.data.awayPoints);
    revalidatePath(`/admin/torneios/${match.tournamentId}/partidas/${match.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível registrar o set." };
  }
  return {};
}

export async function removeSetAction(formData: FormData): Promise<void> {
  const setId = formData.get("setId") as string;
  const set = await prisma.matchSet.findUniqueOrThrow({ where: { id: setId }, include: { match: { include: { tournament: true } } } });
  const session = await auth();
  if (!session?.user || set.match.tournament.organizerId !== session.user.id) {
    throw new Error("Não autorizado.");
  }
  await removeSet(setId);
  revalidatePath(`/admin/torneios/${set.match.tournamentId}/partidas/${set.matchId}`);
}

export async function finishSetsMatchAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const matchId = formData.get("matchId") as string;
  try {
    const match = await requireOwnedMatch(matchId);
    await finishSetsMatch(matchId);
    revalidatePath(`/admin/torneios/${match.tournamentId}/partidas/${match.id}`);
    revalidatePath(`/admin/torneios/${match.tournamentId}`);
    revalidatePath("/torneios");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível encerrar a partida." };
  }
  return {};
}

const basketSchema = z.object({
  matchId: z.string().min(1),
  playerId: z.string().min(1, "Selecione o jogador"),
  teamId: z.string().min(1),
  points: z.coerce.number().int().min(1).max(3),
  period: z.coerce.number().int().min(1).max(10),
});

export async function addBasketAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = basketSchema.safeParse({
    matchId: formData.get("matchId"),
    playerId: formData.get("playerId"),
    teamId: formData.get("teamId"),
    points: formData.get("points"),
    period: formData.get("period"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    await addBasket(parsed.data.matchId, parsed.data.playerId, parsed.data.teamId, parsed.data.points, parsed.data.period);
    revalidatePath(`/admin/torneios/${match.tournamentId}/partidas/${match.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível registrar a cesta." };
  }
  return {};
}

export async function removeBasketAction(formData: FormData): Promise<void> {
  const basketId = formData.get("basketId") as string;
  const basket = await prisma.basket.findUniqueOrThrow({ where: { id: basketId }, include: { match: { include: { tournament: true } } } });
  const session = await auth();
  if (!session?.user || basket.match.tournament.organizerId !== session.user.id) {
    throw new Error("Não autorizado.");
  }
  await removeBasket(basketId);
  revalidatePath(`/admin/torneios/${basket.match.tournamentId}/partidas/${basket.matchId}`);
}

const foulSchema = z.object({
  matchId: z.string().min(1),
  playerId: z.string().min(1, "Selecione o jogador"),
  teamId: z.string().min(1),
  period: z.coerce.number().int().min(1).max(10),
});

export async function addFoulAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = foulSchema.safeParse({
    matchId: formData.get("matchId"),
    playerId: formData.get("playerId"),
    teamId: formData.get("teamId"),
    period: formData.get("period"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    await addFoul(parsed.data.matchId, parsed.data.playerId, parsed.data.teamId, parsed.data.period);
    revalidatePath(`/admin/torneios/${match.tournamentId}/partidas/${match.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível registrar a falta." };
  }
  return {};
}

export async function removeFoulAction(formData: FormData): Promise<void> {
  const foulId = formData.get("foulId") as string;
  const foul = await prisma.foul.findUniqueOrThrow({ where: { id: foulId }, include: { match: { include: { tournament: true } } } });
  const session = await auth();
  if (!session?.user || foul.match.tournament.organizerId !== session.user.id) {
    throw new Error("Não autorizado.");
  }
  await removeFoul(foulId);
  revalidatePath(`/admin/torneios/${foul.match.tournamentId}/partidas/${foul.matchId}`);
}

export async function finishPeriodsMatchAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const matchId = formData.get("matchId") as string;
  try {
    const match = await requireOwnedMatch(matchId);
    await finishPeriodsMatch(matchId);
    revalidatePath(`/admin/torneios/${match.tournamentId}/partidas/${match.id}`);
    revalidatePath(`/admin/torneios/${match.tournamentId}`);
    revalidatePath("/torneios");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível encerrar a partida." };
  }
  return {};
}

const gameSchema = z
  .object({
    matchId: z.string().min(1),
    homePlayerIds: z.array(z.string().min(1)).min(1).max(2),
    awayPlayerIds: z.array(z.string().min(1)).min(1).max(2),
  })
  .refine((d) => d.homePlayerIds.length === d.awayPlayerIds.length, {
    message: "Os dois lados devem ter o mesmo número de jogadores.",
  });

export async function addTableTennisGameAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = gameSchema.safeParse({
    matchId: formData.get("matchId"),
    homePlayerIds: formData.getAll("homePlayerIds"),
    awayPlayerIds: formData.getAll("awayPlayerIds"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const match = await requireOwnedMatch(parsed.data.matchId);
    await addTableTennisGame(parsed.data.matchId, parsed.data.homePlayerIds, parsed.data.awayPlayerIds);
    revalidatePath(`/admin/torneios/${match.tournamentId}/partidas/${match.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível registrar o jogo." };
  }
  return {};
}

export async function removeTableTennisGameAction(formData: FormData): Promise<void> {
  const gameId = formData.get("gameId") as string;
  const game = await prisma.tableTennisGame.findUniqueOrThrow({
    where: { id: gameId },
    include: { match: { include: { tournament: true } } },
  });
  const session = await auth();
  if (!session?.user || game.match.tournament.organizerId !== session.user.id) {
    throw new Error("Não autorizado.");
  }
  await removeTableTennisGame(gameId);
  revalidatePath(`/admin/torneios/${game.match.tournamentId}/partidas/${game.matchId}`);
}

const tableTennisSetSchema = z.object({
  gameId: z.string().min(1),
  setNumber: z.coerce.number().int().min(1).max(10),
  homePoints: z.coerce.number().int().min(0),
  awayPoints: z.coerce.number().int().min(0),
});

export async function addTableTennisSetAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = tableTennisSetSchema.safeParse({
    gameId: formData.get("gameId"),
    setNumber: formData.get("setNumber"),
    homePoints: formData.get("homePoints"),
    awayPoints: formData.get("awayPoints"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const game = await prisma.tableTennisGame.findUniqueOrThrow({
      where: { id: parsed.data.gameId },
      include: { match: { include: { tournament: true } } },
    });
    const session = await auth();
    if (!session?.user || game.match.tournament.organizerId !== session.user.id) {
      throw new Error("Não autorizado.");
    }
    await addTableTennisSet(parsed.data.gameId, parsed.data.setNumber, parsed.data.homePoints, parsed.data.awayPoints);
    revalidatePath(`/admin/torneios/${game.match.tournamentId}/partidas/${game.matchId}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível registrar o set." };
  }
  return {};
}

export async function removeTableTennisSetAction(formData: FormData): Promise<void> {
  const setId = formData.get("setId") as string;
  const set = await prisma.tableTennisSet.findUniqueOrThrow({
    where: { id: setId },
    include: { game: { include: { match: { include: { tournament: true } } } } },
  });
  const session = await auth();
  if (!session?.user || set.game.match.tournament.organizerId !== session.user.id) {
    throw new Error("Não autorizado.");
  }
  await removeTableTennisSet(setId);
  revalidatePath(`/admin/torneios/${set.game.match.tournamentId}/partidas/${set.game.matchId}`);
}

export async function finishTableTennisMatchAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const matchId = formData.get("matchId") as string;
  try {
    const match = await requireOwnedMatch(matchId);
    await finishTableTennisMatch(matchId);
    revalidatePath(`/admin/torneios/${match.tournamentId}/partidas/${match.id}`);
    revalidatePath(`/admin/torneios/${match.tournamentId}`);
    revalidatePath("/torneios");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível encerrar o confronto." };
  }
  return {};
}
