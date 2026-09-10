import { prisma } from "@/lib/db";
import { recordMatchResult } from "@/lib/services/bracket";
import { countSetsWon } from "@/lib/sets";
import { sumPointsByTeam } from "@/lib/points";
import { countGamesWon } from "@/lib/tableTennis";

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

/**
 * `minute` is used by the GOALS_CARDS family (futebol/futsal/futebol7/handebol);
 * `setNumber` is used by vôlei. Exactly one of the two should be passed,
 * depending on the tournament's sport family.
 */
export async function addCard(params: {
  matchId: string;
  playerId: string;
  teamId: string;
  type: "YELLOW" | "RED";
  minute?: number;
  setNumber?: number;
}): Promise<void> {
  const { matchId, playerId, teamId, type, minute, setNumber } = params;
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new Error("Esta equipe não está nesta partida.");
  }
  const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  if (player.teamId !== teamId) {
    throw new Error("Este jogador não pertence à equipe selecionada.");
  }
  await prisma.card.create({ data: { matchId, playerId, teamId, type, minute, setNumber } });
}

export async function removeCard(cardId: string): Promise<void> {
  await prisma.card.delete({ where: { id: cardId } });
}

export async function addSet(matchId: string, setNumber: number, homePoints: number, awayPoints: number): Promise<void> {
  if (homePoints === awayPoints) {
    throw new Error("Um set não pode terminar empatado.");
  }
  await prisma.matchSet.upsert({
    where: { matchId_setNumber: { matchId, setNumber } },
    create: { matchId, setNumber, homePoints, awayPoints },
    update: { homePoints, awayPoints },
  });
}

export async function removeSet(setId: string): Promise<void> {
  await prisma.matchSet.delete({ where: { id: setId } });
}

/**
 * Vôlei matches don't take a manually-typed final score: the score is the
 * count of sets won by each side, derived from the recorded MatchSet rows.
 * Delegates to `recordMatchResult`, which is sport-agnostic — it just
 * compares two numbers and runs the (already generic) bracket-advance logic.
 */
export async function finishSetsMatch(matchId: string): Promise<void> {
  const sets = await prisma.matchSet.findMany({ where: { matchId } });
  if (sets.length === 0) {
    throw new Error("Registre pelo menos um set antes de encerrar a partida.");
  }

  const { home: homeSets, away: awaySets } = countSetsWon(sets);
  if (homeSets === awaySets) {
    throw new Error("Os sets registrados empatam — confira o placar antes de encerrar.");
  }

  await recordMatchResult(matchId, homeSets, awaySets);
}

export async function addBasket(matchId: string, playerId: string, teamId: string, points: number, period: number): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new Error("Esta equipe não está nesta partida.");
  }
  const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  if (player.teamId !== teamId) {
    throw new Error("Este jogador não pertence à equipe selecionada.");
  }
  await prisma.basket.create({ data: { matchId, playerId, teamId, points, period } });
}

export async function removeBasket(basketId: string): Promise<void> {
  await prisma.basket.delete({ where: { id: basketId } });
}

export async function addFoul(matchId: string, playerId: string, teamId: string, period: number): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new Error("Esta equipe não está nesta partida.");
  }
  const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  if (player.teamId !== teamId) {
    throw new Error("Este jogador não pertence à equipe selecionada.");
  }
  await prisma.foul.create({ data: { matchId, playerId, teamId, period } });
}

export async function removeFoul(foulId: string): Promise<void> {
  await prisma.foul.delete({ where: { id: foulId } });
}

/**
 * Basquete matches don't take a manually-typed final score either: it's the
 * sum of basket points per side. Same delegation pattern as `finishSetsMatch`.
 */
export async function finishPeriodsMatch(matchId: string): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (!match.homeTeamId || !match.awayTeamId) {
    throw new Error("As duas equipes ainda não foram definidas para esta partida.");
  }
  const baskets = await prisma.basket.findMany({ where: { matchId } });
  const { home: homeScore, away: awayScore } = sumPointsByTeam(baskets, match.homeTeamId, match.awayTeamId);

  await recordMatchResult(matchId, homeScore, awayScore);
}

export async function addTableTennisGame(matchId: string, homePlayerIds: string[], awayPlayerIds: string[]): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (!match.homeTeamId || !match.awayTeamId) {
    throw new Error("As duas equipes ainda não foram definidas para esta partida.");
  }
  if (homePlayerIds.length < 1 || homePlayerIds.length > 2 || awayPlayerIds.length < 1 || awayPlayerIds.length > 2) {
    throw new Error("Cada lado deve ter 1 jogador (simples) ou 2 (duplas).");
  }
  if (homePlayerIds.length !== awayPlayerIds.length) {
    throw new Error("Os dois lados devem ter o mesmo número de jogadores.");
  }

  const players = await prisma.player.findMany({ where: { id: { in: [...homePlayerIds, ...awayPlayerIds] } } });
  const byId = new Map(players.map((p) => [p.id, p]));
  for (const id of homePlayerIds) {
    if (byId.get(id)?.teamId !== match.homeTeamId) throw new Error("Jogador da casa inválido.");
  }
  for (const id of awayPlayerIds) {
    if (byId.get(id)?.teamId !== match.awayTeamId) throw new Error("Jogador visitante inválido.");
  }

  const gameCount = await prisma.tableTennisGame.count({ where: { matchId } });
  await prisma.tableTennisGame.create({
    data: { matchId, gameNumber: gameCount + 1, homePlayerIds, awayPlayerIds },
  });
}

export async function removeTableTennisGame(gameId: string): Promise<void> {
  await prisma.tableTennisGame.delete({ where: { id: gameId } });
}

async function recomputeGameWinner(gameId: string): Promise<void> {
  const sets = await prisma.tableTennisSet.findMany({ where: { gameId } });
  const { home, away } = countSetsWon(sets);
  const winnerSide = home === away ? null : home > away ? "HOME" : "AWAY";
  await prisma.tableTennisGame.update({ where: { id: gameId }, data: { winnerSide } });
}

/** The game's winner is recomputed automatically from its sets on every change — no separate "finish game" step. */
export async function addTableTennisSet(gameId: string, setNumber: number, homePoints: number, awayPoints: number): Promise<void> {
  if (homePoints === awayPoints) {
    throw new Error("Um set não pode terminar empatado.");
  }
  await prisma.tableTennisSet.upsert({
    where: { gameId_setNumber: { gameId, setNumber } },
    create: { gameId, setNumber, homePoints, awayPoints },
    update: { homePoints, awayPoints },
  });
  await recomputeGameWinner(gameId);
}

export async function removeTableTennisSet(setId: string): Promise<void> {
  const set = await prisma.tableTennisSet.findUniqueOrThrow({ where: { id: setId } });
  await prisma.tableTennisSet.delete({ where: { id: setId } });
  await recomputeGameWinner(set.gameId);
}

/**
 * Tênis de mesa matches are decided by games won, not a typed score — same
 * delegation pattern as `finishSetsMatch`/`finishPeriodsMatch`. Only games
 * with a decided winner (i.e. not tied on sets) count toward the tie.
 */
export async function finishTableTennisMatch(matchId: string): Promise<void> {
  const games = await prisma.tableTennisGame.findMany({ where: { matchId } });
  if (games.length === 0) {
    throw new Error("Registre pelo menos um jogo antes de encerrar o confronto.");
  }

  const { home: homeGames, away: awayGames } = countGamesWon(games);
  if (homeGames === awayGames) {
    throw new Error("Os jogos registrados empatam — confira os resultados antes de encerrar.");
  }

  await recordMatchResult(matchId, homeGames, awayGames);
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
