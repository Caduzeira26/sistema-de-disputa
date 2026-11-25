import { prisma } from "@/lib/db";
import { recordMatchResult } from "@/lib/services/bracket";
import {
  goalValue,
  kingsPhases,
  kingsScore,
  validateDice,
  validatePresidentPenalty,
  validateSecretCard,
  type GoalKind,
  type SecretCard,
} from "@/lib/kings";

/** Partida aberta da Kings League, com as fases do campeonato e os eventos já lançados. */
async function openKingsMatch(matchId: string) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: { tournament: true, kingsEvents: true },
  });
  if (match.tournament.sportType !== "KINGS_LEAGUE") throw new Error("Esta partida não é de Kings League.");
  if (match.status === "FINISHED") throw new Error("A partida já foi encerrada. Reabra para corrigir.");
  if (!match.homeTeamId || !match.awayTeamId) throw new Error("As duas equipes ainda não foram definidas.");
  const phases = kingsPhases(match.tournament.kingsFirstHalfMinutes, match.tournament.kingsSecondHalfMinutes);
  return { match, phases, homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId };
}

function checkMinute(minute: number, end: number) {
  if (!Number.isInteger(minute) || minute < 0 || minute > end + 30) {
    throw new Error(`Minuto inválido (o tempo vai de 0' a ${end}', mais o matchball).`);
  }
}

async function playerOf(playerId: string, teamId: string, message: string) {
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || player.teamId !== teamId) throw new Error(message);
  return player;
}

/** Cartas que contam como uma dada carta (o coringa pode ser usado como qualquer outra). */
function cardCountsAs(card: SecretCard | null, wanted: SecretCard): boolean {
  return card === wanted || card === "CORINGA";
}

export async function addKingsGoal(params: { matchId: string; playerId: string; teamId: string; minute: number; kind: GoalKind }) {
  const { match, phases, homeTeamId, awayTeamId } = await openKingsMatch(params.matchId);
  const { playerId, teamId, minute, kind } = params;
  if (teamId !== homeTeamId && teamId !== awayTeamId) throw new Error("Esta equipe não está nesta partida.");
  checkMinute(minute, phases.end);
  await playerOf(playerId, teamId, "Este jogador não pertence à equipe selecionada.");

  const teamCards = match.kingsEvents.filter((e) => e.type === "SECRET_CARD" && e.teamId === teamId);
  if (kind === "CARD_DOUBLE") {
    const card = teamCards.find((e) => cardCountsAs(e.card, "GOL_X2"));
    if (!card || card.minute === null || minute < card.minute || minute >= card.minute + 4) {
      throw new Error("Gol x2 só vale nos 4 minutos depois que o time usou a carta Gol x2.");
    }
  }
  if (kind === "STAR_PLAYER") {
    const star = teamCards.find((e) => cardCountsAs(e.card, "JOGADOR_ESTRELA") && e.playerId === playerId);
    if (!star) throw new Error("Este jogador não foi escolhido como jogador estrela.");
    const already = await prisma.goal.count({ where: { matchId: match.id, playerId, kind: "STAR_PLAYER" } });
    if (already > 0) throw new Error("Só o primeiro gol do jogador estrela vale em dobro.");
  }

  await prisma.goal.create({
    data: { matchId: match.id, playerId, teamId, minute, kind, value: goalValue(kind) },
  });
}

export async function addSecretCard(params: {
  matchId: string;
  teamId: string;
  card: SecretCard;
  minute: number;
  playerId?: string | null;
  /** Pênalti / shootout: o batedor converteu. Pênalti inverso: o adversário errou (gol para o time da carta). */
  scored?: boolean | null;
}) {
  const { match, phases, homeTeamId, awayTeamId } = await openKingsMatch(params.matchId);
  const { teamId, card, minute } = params;
  if (teamId !== homeTeamId && teamId !== awayTeamId) throw new Error("Esta equipe não está nesta partida.");
  checkMinute(minute, phases.end);
  const error = validateSecretCard(minute, teamId, match.kingsEvents, phases);
  if (error) throw new Error(error);

  const opponentId = teamId === homeTeamId ? awayTeamId : homeTeamId;
  let playerId: string | null = null;
  if (card === "SUSPENSAO") {
    if (!params.playerId) throw new Error("Escolha o jogador adversário suspenso.");
    const player = await playerOf(params.playerId, opponentId, "Na suspensão, escolha um jogador do time adversário.");
    if (player.isGoalkeeper) throw new Error("A suspensão não vale para o goleiro.");
    playerId = player.id;
  } else if (card === "JOGADOR_ESTRELA" || card === "PENALTI" || card === "SHOOTOUT") {
    if (!params.playerId) {
      throw new Error(card === "JOGADOR_ESTRELA" ? "Escolha o jogador estrela." : "Escolha o batedor.");
    }
    playerId = (await playerOf(params.playerId, teamId, "Escolha um jogador do time que usou a carta.")).id;
  } else if (params.playerId) {
    playerId = (await playerOf(params.playerId, teamId, "Escolha um jogador do time que usou a carta.")).id;
  }

  const scored = card === "PENALTI" || card === "SHOOTOUT" || card === "PENALTI_INVERSO" ? Boolean(params.scored) : null;
  // Pênalti inverso: o adversário bate; se errar, o gol (sem autor) é do time da carta.
  const goalsAwarded = card === "PENALTI_INVERSO" && scored ? 1 : 0;

  await prisma.$transaction(async (tx) => {
    await tx.kingsEvent.create({
      data: { matchId: match.id, type: "SECRET_CARD", teamId, card, minute, playerId, scored, goalsAwarded },
    });
    // Pênalti ou shootout convertido vira gol do batedor (entra na artilharia).
    if ((card === "PENALTI" || card === "SHOOTOUT") && scored && playerId) {
      const kind: GoalKind = card === "PENALTI" ? "PENALTY" : "SHOOTOUT";
      await tx.goal.create({ data: { matchId: match.id, playerId, teamId, minute, kind, value: goalValue(kind) } });
    }
  });
}

export async function addPresidentPenalty(params: { matchId: string; teamId: string; minute: number; scored: boolean }) {
  const { match, phases, homeTeamId, awayTeamId } = await openKingsMatch(params.matchId);
  const { teamId, minute, scored } = params;
  if (teamId !== homeTeamId && teamId !== awayTeamId) throw new Error("Esta equipe não está nesta partida.");
  checkMinute(minute, phases.end);
  const error = validatePresidentPenalty(minute, teamId, match.kingsEvents, phases);
  if (error) throw new Error(error);
  await prisma.kingsEvent.create({
    data: { matchId: match.id, type: "PRESIDENT_PENALTY", teamId, minute, scored, goalsAwarded: scored ? 1 : 0 },
  });
}

export async function setDice(matchId: string, result: number) {
  const { match, phases } = await openKingsMatch(matchId);
  const error = validateDice(result, match.kingsEvents);
  if (error) throw new Error(error);
  await prisma.kingsEvent.create({ data: { matchId: match.id, type: "DICE", diceResult: result, minute: phases.halfTime } });
}

export async function removeKingsEvent(eventId: string) {
  const event = await prisma.kingsEvent.findUniqueOrThrow({ where: { id: eventId } });
  await openKingsMatch(event.matchId);
  await prisma.$transaction(async (tx) => {
    await tx.kingsEvent.delete({ where: { id: eventId } });
    // Desfaz o gol criado pelo pênalti/shootout da carta.
    if (event.type === "SECRET_CARD" && (event.card === "PENALTI" || event.card === "SHOOTOUT") && event.scored && event.playerId) {
      const goal = await tx.goal.findFirst({
        where: {
          matchId: event.matchId,
          playerId: event.playerId,
          minute: event.minute ?? undefined,
          kind: event.card === "PENALTI" ? "PENALTY" : "SHOOTOUT",
        },
      });
      if (goal) await tx.goal.delete({ where: { id: goal.id } });
    }
  });
}

/** O tipo de gol mudou o placar: só deixa apagar com a partida aberta. */
export async function removeKingsGoal(goalId: string) {
  const goal = await prisma.goal.findUniqueOrThrow({ where: { id: goalId } });
  await openKingsMatch(goal.matchId);
  await prisma.goal.delete({ where: { id: goalId } });
}

/**
 * Encerra a partida com o placar calculado pela súmula. Empate vai para os shootouts,
 * que precisam de um vencedor (eles decidem a partida, não entram no placar).
 */
export async function finishKingsMatch(matchId: string, shootouts: { home: number; away: number } | null) {
  const { match, homeTeamId, awayTeamId } = await openKingsMatch(matchId);
  const goals = await prisma.goal.findMany({ where: { matchId: match.id }, select: { teamId: true, value: true } });
  const score = kingsScore(goals, match.kingsEvents, homeTeamId, awayTeamId);
  if (score.home === score.away) {
    if (!shootouts) throw new Error(`Placar empatado em ${score.home} x ${score.away}: informe o resultado dos shootouts.`);
    if (shootouts.home === shootouts.away) throw new Error("Os shootouts precisam ter um vencedor.");
    await recordMatchResult(match.id, score.home, score.away, shootouts);
  } else {
    await recordMatchResult(match.id, score.home, score.away, null);
  }
}
