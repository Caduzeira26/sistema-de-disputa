import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  generateSingleElimination,
  generateDoubleElimination,
  generateGroupStage,
  computeStandings,
  applyMatchResult,
  type TeamInput,
  type GeneratedMatch,
  type GeneratedGroup,
} from "@/lib/bracket";

function groupName(index: number): string {
  return `Grupo ${String.fromCharCode(65 + index)}`;
}

/** Inserts generated groups/matches, remapping the generator's synthetic ids to real ones
 * (two-phase: rows first, then the winner/loser pointers, since Postgres enforces FKs eagerly). */
async function persistGeneratedBracket(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  groups: GeneratedGroup[],
  matches: GeneratedMatch[]
) {
  const idMap = new Map<string, string>();
  for (const g of groups) idMap.set(g.id, randomUUID());
  for (const m of matches) idMap.set(m.id, randomUUID());

  if (groups.length > 0) {
    await tx.group.createMany({
      data: groups.map((g, i) => ({ id: idMap.get(g.id)!, tournamentId, name: groupName(i) })),
    });
    await Promise.all(
      groups.flatMap((g) =>
        g.teamIds.map((teamId) => tx.team.update({ where: { id: teamId }, data: { groupId: idMap.get(g.id)! } }))
      )
    );
  }

  await tx.match.createMany({
    data: matches.map((m) => ({
      id: idMap.get(m.id)!,
      tournamentId,
      bracket: m.bracket,
      round: m.round,
      position: m.position,
      groupId: m.groupId ? idMap.get(m.groupId)! : null,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      status: m.autoWinnerTeamId ? "FINISHED" : "SCHEDULED",
      homeScore: m.autoWinnerTeamId ? (m.autoWinnerTeamId === m.homeTeamId ? 1 : 0) : null,
      awayScore: m.autoWinnerTeamId ? (m.autoWinnerTeamId === m.awayTeamId ? 1 : 0) : null,
      isReset: m.isReset,
    })),
  });

  for (const m of matches) {
    if (!m.winnerNextMatchId && !m.loserNextMatchId) continue;
    await tx.match.update({
      where: { id: idMap.get(m.id)! },
      data: {
        winnerNextMatchId: m.winnerNextMatchId ? idMap.get(m.winnerNextMatchId)! : null,
        winnerNextSlot: m.winnerNextSlot,
        loserNextMatchId: m.loserNextMatchId ? idMap.get(m.loserNextMatchId)! : null,
        loserNextSlot: m.loserNextSlot,
      },
    });
  }
}

export async function generateBracket(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    include: { teams: { where: { status: "APPROVED" }, orderBy: { createdAt: "asc" } } },
  });

  const existing = await prisma.match.count({ where: { tournamentId } });
  if (existing > 0) {
    throw new Error("O chaveamento já foi gerado para este torneio.");
  }
  if (tournament.teams.length < 2) {
    throw new Error("É preciso pelo menos 2 equipes aprovadas para gerar o chaveamento.");
  }

  // Seed by approval order — there's no manual seeding UI yet.
  const teamInputs: TeamInput[] = tournament.teams.map((t, i) => ({ id: t.id, seed: i + 1 }));

  await prisma.$transaction(async (tx) => {
    await Promise.all(teamInputs.map((t) => tx.team.update({ where: { id: t.id }, data: { seed: t.seed } })));

    if (tournament.format === "SINGLE_ELIMINATION") {
      const { matches } = generateSingleElimination(teamInputs);
      await persistGeneratedBracket(tx, tournamentId, [], matches);
    } else if (tournament.format === "DOUBLE_ELIMINATION") {
      const { matches } = generateDoubleElimination(teamInputs);
      await persistGeneratedBracket(tx, tournamentId, [], matches);
    } else {
      const numGroups = tournament.numGroups ?? Math.max(1, Math.round(Math.sqrt(teamInputs.length)));
      const { groups, matches } = generateGroupStage(teamInputs, numGroups);
      await persistGeneratedBracket(tx, tournamentId, groups, matches);
    }

    await tx.tournament.update({ where: { id: tournamentId }, data: { status: "IN_PROGRESS" } });
  });
}

export async function generateEliminationFromStandings(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    include: {
      groups: { include: { teams: true } },
      matches: { where: { bracket: "GROUP" } },
    },
  });

  if (tournament.format !== "GROUPS_SINGLE_ELIM" && tournament.format !== "GROUPS_DOUBLE_ELIM") {
    throw new Error("Este torneio não usa fase de grupos.");
  }
  const existingElim = await prisma.match.count({
    where: { tournamentId, bracket: { in: ["WINNERS", "LOSERS", "GRAND_FINAL"] } },
  });
  if (existingElim > 0) {
    throw new Error("A eliminatória já foi gerada para este torneio.");
  }

  const advancePerGroup = tournament.advancePerGroup ?? 2;
  const qualifiersByPlacement: string[][] = [];

  for (const group of tournament.groups) {
    const teamIds = group.teams.map((t) => t.id);
    const groupMatches = tournament.matches.filter((m) => m.groupId === group.id);
    const standings = computeStandings(teamIds, groupMatches, {
      win: tournament.pointsWin,
      draw: tournament.pointsDraw,
      loss: tournament.pointsLoss,
    });
    standings.slice(0, advancePerGroup).forEach((s, placementIdx) => {
      (qualifiersByPlacement[placementIdx] ??= []).push(s.teamId);
    });
  }

  const orderedQualifiers = qualifiersByPlacement.flat();
  if (orderedQualifiers.length < 2) {
    throw new Error("Não há classificados suficientes para gerar a eliminatória.");
  }
  const teamInputs: TeamInput[] = orderedQualifiers.map((id, i) => ({ id, seed: i + 1 }));

  const { matches } =
    tournament.format === "GROUPS_SINGLE_ELIM"
      ? generateSingleElimination(teamInputs)
      : generateDoubleElimination(teamInputs);

  await prisma.$transaction(async (tx) => {
    await Promise.all(teamInputs.map((t) => tx.team.update({ where: { id: t.id }, data: { seed: t.seed } })));
    await persistGeneratedBracket(tx, tournamentId, [], matches);
  });
}

export async function recordMatchResult(matchId: string, homeScore: number, awayScore: number): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });

  if (match.bracket === "GROUP") {
    if (match.status === "FINISHED") throw new Error("Esta partida já foi encerrada.");
    await prisma.match.update({ where: { id: matchId }, data: { homeScore, awayScore, status: "FINISHED" } });
    return;
  }
  if (match.status === "FINISHED") {
    throw new Error("Esta partida já foi encerrada.");
  }

  const allMatches = await prisma.match.findMany({ where: { tournamentId: match.tournamentId } });
  const outcome = applyMatchResult(
    {
      id: match.id,
      bracket: match.bracket,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      winnerNextMatchId: match.winnerNextMatchId,
      winnerNextSlot: match.winnerNextSlot,
      loserNextMatchId: match.loserNextMatchId,
      loserNextSlot: match.loserNextSlot,
      isReset: match.isReset,
    },
    homeScore,
    awayScore,
    allMatches
  );

  await prisma.$transaction(async (tx) => {
    await tx.match.update({ where: { id: matchId }, data: { homeScore, awayScore, status: "FINISHED" } });

    for (const update of outcome.slotUpdates) {
      await tx.match.update({
        where: { id: update.matchId },
        data: update.slot === "HOME" ? { homeTeamId: update.teamId } : { awayTeamId: update.teamId },
      });
    }

    if (outcome.championTeamId) {
      await tx.tournament.update({
        where: { id: match.tournamentId },
        data: { championTeamId: outcome.championTeamId, status: "FINISHED" },
      });
    }
  });
}
