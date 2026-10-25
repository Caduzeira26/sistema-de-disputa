import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HEAT_SIZE, advanceCount, nextRoundHeats, rankHeatByScore, type Advancer, type ScoreInput } from "@/lib/heats";

export interface HeatView {
  id: string;
  number: number;
  finished: boolean;
  /** Best placement first once the heat is played; registration order before that. */
  entries: { teamId: string; placement: number | null; score: number | null }[];
}

export interface PhaseView {
  phase: number;
  heats: HeatView[];
}

export interface HeatsOverview {
  phases: PhaseView[];
}

async function loadHeatsTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    include: {
      teams: { where: { status: "APPROVED" }, orderBy: { createdAt: "asc" } },
      lobbyRounds: {
        where: { stage: "HEAT" },
        include: { entries: { include: { team: true } } },
        orderBy: [{ phase: "asc" }, { number: "asc" }],
      },
    },
  });
  if (tournament.format !== "HEATS") throw new Error("Este torneio não usa baterias.");
  return tournament;
}

/** Everything the admin and public pages need to render the heats tournament. */
export async function loadHeatsOverview(tournamentId: string): Promise<HeatsOverview> {
  const t = await loadHeatsTournament(tournamentId);
  const phases = new Map<number, HeatView[]>();
  for (const round of t.lobbyRounds) {
    const entries = round.entries
      .map((e) => ({ teamId: e.teamId, placement: e.placement, score: e.score }))
      .sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99));
    const list = phases.get(round.phase) ?? [];
    list.push({ id: round.id, number: round.number, finished: round.finished, entries });
    phases.set(round.phase, list);
  }
  return {
    phases: [...phases.entries()].sort(([a], [b]) => a - b).map(([phase, heats]) => ({ phase, heats })),
  };
}

/** Creates one round's heats (used by the draw confirmation and by "next round"). */
export async function createHeatRounds(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  phase: number,
  heats: string[][]
): Promise<void> {
  for (let i = 0; i < heats.length; i++) {
    await tx.lobbyRound.create({
      data: {
        tournamentId,
        stage: "HEAT",
        phase,
        number: i + 1,
        groupId: null,
        entries: { create: heats[i].map((teamId) => ({ teamId })) },
      },
    });
  }
}

/** With 4 or fewer dancers there's nothing to draw: they all dance in a single heat. */
export async function createSingleHeat(tournamentId: string): Promise<void> {
  const t = await loadHeatsTournament(tournamentId);
  if (t.lobbyRounds.length > 0) throw new Error("As baterias já foram criadas.");
  if (t.teams.length < 2) throw new Error("É preciso pelo menos 2 dançarinos aprovados.");
  if (t.teams.length > HEAT_SIZE) {
    throw new Error(`Com mais de ${HEAT_SIZE} dançarinos é preciso fazer o sorteio das baterias antes.`);
  }

  await prisma.$transaction(async (tx) => {
    await createHeatRounds(tx, tournamentId, 1, [t.teams.map((team) => team.id)]);
    await tx.tournament.update({ where: { id: tournamentId }, data: { status: "IN_PROGRESS" } });
  });
}

/** Records a heat's song scores; placements are derived from them (higher wins, no ties). */
export async function saveHeat(roundId: string, scores: ScoreInput[]): Promise<void> {
  const round = await prisma.lobbyRound.findUniqueOrThrow({
    where: { id: roundId },
    include: { entries: { include: { team: true } }, tournament: true },
  });
  if (round.stage !== "HEAT") throw new Error("Esta não é uma bateria.");
  if (round.tournament.status === "FINISHED") {
    throw new Error("O campeonato já foi encerrado. Reabra o campeonato para corrigir uma bateria.");
  }
  const later = await prisma.lobbyRound.count({
    where: { tournamentId: round.tournamentId, stage: "HEAT", phase: { gt: round.phase } },
  });
  if (later > 0) throw new Error("A próxima rodada já foi gerada a partir desta; não dá mais para alterar esta bateria.");

  const expected = new Set(round.entries.map((e) => e.teamId));
  if (scores.length !== expected.size || scores.some((s) => !expected.has(s.teamId))) {
    throw new Error("A súmula precisa ter exatamente os dançarinos desta bateria.");
  }

  const names = Object.fromEntries(round.entries.map((e) => [e.teamId, e.team.name]));
  const ranked = rankHeatByScore(scores, names);
  if (!ranked.ok) throw new Error(ranked.error);

  await prisma.$transaction([
    ...ranked.placements.map((p) =>
      prisma.lobbyEntry.update({
        where: { roundId_teamId: { roundId, teamId: p.teamId } },
        data: { placement: p.placement, score: p.score },
      })
    ),
    prisma.lobbyRound.update({ where: { id: roundId }, data: { finished: true } }),
  ]);
}

export async function reopenHeat(roundId: string): Promise<void> {
  const round = await prisma.lobbyRound.findUniqueOrThrow({ where: { id: roundId }, include: { tournament: true } });
  if (round.tournament.status === "FINISHED") throw new Error("O campeonato já foi encerrado. Reabra o campeonato antes.");
  const later = await prisma.lobbyRound.count({
    where: { tournamentId: round.tournamentId, stage: "HEAT", phase: { gt: round.phase } },
  });
  if (later > 0) throw new Error("A próxima rodada já foi gerada a partir desta bateria.");

  await prisma.$transaction([
    prisma.lobbyEntry.updateMany({ where: { roundId }, data: { placement: null, score: null } }),
    prisma.lobbyRound.update({ where: { id: roundId }, data: { finished: false } }),
  ]);
}

/** Takes the best of every heat of the latest round and builds the next round's heats. */
export async function generateNextHeatRound(tournamentId: string): Promise<void> {
  const t = await loadHeatsTournament(tournamentId);
  if (t.status === "FINISHED") throw new Error("O campeonato já foi encerrado.");

  const overview = await loadHeatsOverview(tournamentId);
  const latest = overview.phases[overview.phases.length - 1];
  if (!latest) throw new Error("Crie as baterias antes.");
  if (latest.heats.some((h) => !h.finished)) throw new Error("Ainda há baterias sem resultado nesta rodada.");
  if (latest.heats.length === 1) throw new Error("Esta já foi a bateria final. Encerre o campeonato.");

  const advancers: Advancer[] = latest.heats.flatMap((heat) =>
    heat.entries.slice(0, advanceCount(heat.entries.length)).map((e) => ({
      teamId: e.teamId,
      placement: e.placement!,
      fromHeat: heat.number,
    }))
  );

  await prisma.$transaction((tx) => createHeatRounds(tx, tournamentId, latest.phase + 1, nextRoundHeats(advancers)));
}

/** Crowns the winner of the final heat. */
export async function finishHeatsTournament(tournamentId: string): Promise<void> {
  const t = await loadHeatsTournament(tournamentId);
  if (t.status === "FINISHED") throw new Error("O campeonato já foi encerrado.");

  const overview = await loadHeatsOverview(tournamentId);
  const latest = overview.phases[overview.phases.length - 1];
  if (!latest) throw new Error("Ainda não há baterias.");
  if (latest.heats.length !== 1) throw new Error("Gere as próximas rodadas até chegar à bateria final.");
  const final = latest.heats[0];
  if (!final.finished) throw new Error("A bateria final ainda não tem resultado.");

  const [first, second, third] = final.entries;
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      championTeamId: first.teamId,
      runnerUpTeamId: second?.teamId ?? null,
      thirdPlaceTeamIds: third ? [third.teamId] : [],
      status: "FINISHED",
    },
  });
}

/** Undoes `finishHeatsTournament` so the final heat can be corrected. */
export async function reopenHeatsTournament(tournamentId: string): Promise<void> {
  const t = await loadHeatsTournament(tournamentId);
  if (t.status !== "FINISHED") throw new Error("O campeonato não está encerrado.");
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { championTeamId: null, runnerUpTeamId: null, thirdPlaceTeamIds: [], status: "IN_PROGRESS" },
  });
}
