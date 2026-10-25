"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateEliminationFromStandings, recordMatchResult, resetBracket } from "@/lib/services/bracket";
import { supportsPenalties } from "@/lib/sport";

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

export async function resetBracketAction(
  _prevState: BracketActionState,
  formData: FormData
): Promise<BracketActionState> {
  const tournamentId = formData.get("tournamentId") as string;
  try {
    await requireOwnedTournament(tournamentId);
    await resetBracket(tournamentId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível apagar o chaveamento." };
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

const optionalCount = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().min(0).optional()
);

const resultSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
  homePenalties: optionalCount,
  awayPenalties: optionalCount,
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
    homePenalties: formData.get("homePenalties"),
    awayPenalties: formData.get("awayPenalties"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Placar inválido." };
  }

  const match = await prisma.match.findUnique({ where: { id: parsed.data.matchId } });
  if (!match) return { error: "Partida não encontrada." };
  const tournament = await requireOwnedTournament(match.tournamentId);

  const { homeScore, awayScore, homePenalties, awayPenalties } = parsed.data;
  const hasShootout = homePenalties !== undefined && awayPenalties !== undefined;
  if ((homePenalties === undefined) !== (awayPenalties === undefined)) {
    return { error: "Informe os pênaltis dos dois lados." };
  }
  if (hasShootout && homeScore === awayScore && homePenalties === awayPenalties) {
    return { error: "A disputa de pênaltis não pode terminar empatada." };
  }
  const penalties = hasShootout && supportsPenalties(tournament.sportType)
    ? { home: homePenalties, away: awayPenalties }
    : null;

  if (match.bracket !== "GROUP" && homeScore === awayScore && !penalties) {
    return {
      error: supportsPenalties(tournament.sportType)
        ? "Jogo eliminatório não pode terminar empatado: informe a disputa de pênaltis."
        : "Jogo eliminatório não pode terminar empatado. Repita a partida ou ajuste o placar.",
    };
  }

  try {
    await recordMatchResult(parsed.data.matchId, homeScore, awayScore, penalties);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível salvar o placar." };
  }

  revalidatePath(`/admin/torneios/${match.tournamentId}`);
  revalidatePath(`/torneios`);
  return {};
}
