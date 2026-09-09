import { prisma } from "@/lib/db";

export async function addGoal(matchId: string, playerId: string, teamId: string, minute: number): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new Error("Esta equipe não está nesta partida.");
  }
  const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  if (player.teamId !== teamId) {
    throw new Error("Este jogador não pertence à equipe selecionada.");
  }
  await prisma.goal.create({ data: { matchId, playerId, teamId, minute } });
}

export async function removeGoal(goalId: string): Promise<void> {
  await prisma.goal.delete({ where: { id: goalId } });
}

export async function addCard(
  matchId: string,
  playerId: string,
  teamId: string,
  type: "YELLOW" | "RED",
  minute: number
): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new Error("Esta equipe não está nesta partida.");
  }
  const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  if (player.teamId !== teamId) {
    throw new Error("Este jogador não pertence à equipe selecionada.");
  }
  await prisma.card.create({ data: { matchId, playerId, teamId, type, minute } });
}

export async function removeCard(cardId: string): Promise<void> {
  await prisma.card.delete({ where: { id: cardId } });
}

/**
 * Reopens a finished match so its score/goals/cards can be corrected. Safe
 * by construction: it refuses when a downstream match (the one this match's
 * winner or loser advanced into) has already been played, since undoing this
 * result would silently invalidate that one too. The organizer just needs to
 * reopen matches back-to-front — furthest along first.
 */
export async function reopenMatch(matchId: string): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (match.status !== "FINISHED") {
    throw new Error("Esta partida não está encerrada.");
  }

  if (match.bracket === "GROUP") {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "SCHEDULED", homeScore: null, awayScore: null },
    });
    return;
  }

  if (match.winnerNextMatchId) {
    const next = await prisma.match.findUnique({ where: { id: match.winnerNextMatchId } });
    if (next?.status === "FINISHED") {
      throw new Error("Reabra primeiro a partida seguinte, que já usou o resultado desta.");
    }
  }
  if (match.loserNextMatchId) {
    const next = await prisma.match.findUnique({ where: { id: match.loserNextMatchId } });
    if (next?.status === "FINISHED") {
      throw new Error("Reabra primeiro a partida da repescagem, que já usou o resultado desta.");
    }
  }

  let resetIdToClear: string | null = null;
  if (match.bracket === "GRAND_FINAL" && !match.isReset) {
    const reset = await prisma.match.findFirst({
      where: { tournamentId: match.tournamentId, bracket: "GRAND_FINAL", isReset: true },
    });
    if (reset && (reset.homeTeamId || reset.awayTeamId)) {
      if (reset.status === "FINISHED") {
        throw new Error("Reabra primeiro o jogo de desempate (reset) da grande final.");
      }
      resetIdToClear = reset.id;
    }
  }

  const decidedChampion =
    (match.bracket === "GRAND_FINAL" && (match.isReset || !match.winnerNextMatchId)) ||
    (match.bracket === "WINNERS" && !match.winnerNextMatchId);

  await prisma.$transaction(async (tx) => {
    if (match.winnerNextMatchId && match.winnerNextSlot) {
      await tx.match.update({
        where: { id: match.winnerNextMatchId },
        data: match.winnerNextSlot === "HOME" ? { homeTeamId: null } : { awayTeamId: null },
      });
    }
    if (match.loserNextMatchId && match.loserNextSlot) {
      await tx.match.update({
        where: { id: match.loserNextMatchId },
        data: match.loserNextSlot === "HOME" ? { homeTeamId: null } : { awayTeamId: null },
      });
    }
    if (resetIdToClear) {
      await tx.match.update({ where: { id: resetIdToClear }, data: { homeTeamId: null, awayTeamId: null } });
    }
    if (decidedChampion) {
      await tx.tournament.update({
        where: { id: match.tournamentId },
        data: { championTeamId: null, status: "IN_PROGRESS" },
      });
    }
    await tx.match.update({
      where: { id: matchId },
      data: { status: "SCHEDULED", homeScore: null, awayScore: null },
    });
  });
}
