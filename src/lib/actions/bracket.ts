"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateBracket, generateEliminationFromStandings, recordMatchResult } from "@/lib/services/bracket";

async function requireOwnedTournament(tournamentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.organizerId !== session.user.id) {
    throw new Error("Torneio não encontrado.");
  }
  return tournament;
}

export type BracketActionState = { error?: string };

export async function generateBracketAction(
  _prevState: BracketActionState,
  formData: FormData
): Promise<BracketActionState> {
  const tournamentId = formData.get("tournamentId") as string;
  try {
    await requireOwnedTournament(tournamentId);
    await generateBracket(tournamentId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível gerar o chaveamento." };
  }
  revalidatePath(`/admin/torneios/${tournamentId}`);
  revalidatePath(`/torneios`);
  return {};
}

export async function generateEliminationAction(
  _prevState: BracketActionState,
  formData: FormData
): Promise<BracketActionState> {
  const tournamentId = formData.get("tournamentId") as string;
  try {
    await requireOwnedTournament(tournamentId);
    await generateEliminationFromStandings(tournamentId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível gerar a eliminatória." };
  }
  revalidatePath(`/admin/torneios/${tournamentId}`);
  return {};
}

const resultSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});

export type RecordResultState = { error?: string };

export async function recordMatchResultAction(
  _prevState: RecordResultState,
  formData: FormData
): Promise<RecordResultState> {
  const parsed = resultSchema.safeParse({
    matchId: formData.get("matchId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Placar inválido." };
  }

  const match = await prisma.match.findUnique({ where: { id: parsed.data.matchId } });
  if (!match) return { error: "Partida não encontrada." };
  await requireOwnedTournament(match.tournamentId);

  try {
    await recordMatchResult(parsed.data.matchId, parsed.data.homeScore, parsed.data.awayScore);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar o placar." };
  }

  revalidatePath(`/admin/torneios/${match.tournamentId}`);
  revalidatePath(`/torneios`);
  return {};
}
