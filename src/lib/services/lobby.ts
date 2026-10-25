import { prisma } from "@/lib/db";
import {
  LOBBY_SIZE,
  computeLobbyStandings,
  entryPoints,
  validateRoundEntries,
  type EntryInput,
  type StandingRow,
} from "@/lib/lobbyScoring";

async function loadFreeFireTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    include: {
      groups: { orderBy: { name: "asc" } },
      teams: { where: { status: "APPROVED" }, orderBy: { createdAt: "asc" } },
      lobbyRounds: { include: { entries: true }, orderBy: [{ stage: "asc" }, { number: "asc" }] },
    },
  });
  if (tournament.format !== "LOBBY_LEAGUE") {
    throw new Error("Este torneio não usa quedas.");
  }
  return tournament;
}

export interface LobbySection {
  /** The group (lobby) this table belongs to; null = every team together. */
  group: { id: string; name: string } | null;
  teamIds: string[];
  rounds: { id: string; number: number; finished: boolean; entries: { teamId: string; placement: number | null; kills: number; points: number }[] }[];
  standings: StandingRow[];
}

export interface LobbyOverview {
  qualifying: LobbySection[];
  final: LobbySection | null;
}

function buildSection(
  group: { id: string; name: string } | null,
  teamIds: string[],
  rounds: Awaited<ReturnType<typeof loadFreeFireTournament>>["lobbyRounds"]
): LobbySection {
  return {
    group,
    teamIds,
    rounds: rounds.map((r) => ({ id: r.id, number: r.number, finished: r.finished, entries: r.entries })),
    standings: computeLobbyStandings(
      teamIds,
      rounds.map((r) => ({ number: r.number, entries: r.entries }))
    ),
  };
}

/** Everything the admin and public pages need to render the lobby tournament. */
export async function loadLobbyOverview(tournamentId: string): Promise<LobbyOverview> {
  const t = await loadFreeFireTournament(tournamentId);
  const qualifyingRounds = t.lobbyRounds.filter((r) => r.stage === "QUALIFYING");
  const finalRounds = t.lobbyRounds.filter((r) => r.stage === "FINAL");

  const qualifying: LobbySection[] =
    t.groups.length > 0
      ? t.groups.map((g) =>
          buildSection(
            { id: g.id, name: g.name },
            t.teams.filter((team) => team.groupId === g.id).map((team) => team.id),
            qualifyingRounds.filter((r) => r.groupId === g.id)
          )
        )
      : [
          buildSection(
            null,
            t.teams.map((team) => team.id),
            qualifyingRounds
          ),
        ];

  const final =
    finalRounds.length > 0
      ? buildSection(null, [...new Set(finalRounds.flatMap((r) => r.entries.map((e) => e.teamId)))], finalRounds)
      : null;

  return { qualifying, final };
}

/** Adds `count` more qualifying quedas to every lobby (each group, or the whole field when there are no groups). */
export async function createLobbyRounds(tournamentId: string, count: number): Promise<void> {
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new Error("Informe de 1 a 20 quedas.");
  }
  const t = await loadFreeFireTournament(tournamentId);
  if (t.status === "FINISHED") throw new Error("O campeonato já foi encerrado.");
  if (t.lobbyRounds.some((r) => r.stage === "FINAL")) {
    throw new Error("A grande final já foi gerada; não dá mais para criar quedas da fase classificatória.");
  }

  const lobbies: { groupId: string | null; teamIds: string[] }[] =
    t.groups.length > 0
      ? t.groups.map((g) => ({ groupId: g.id, teamIds: t.teams.filter((team) => team.groupId === g.id).map((team) => team.id) }))
      : [{ groupId: null, teamIds: t.teams.map((team) => team.id) }];

  if (t.groups.length === 0 && t.teams.length > LOBBY_SIZE) {
    throw new Error(`Com mais de ${LOBBY_SIZE} equipes é preciso fazer o sorteio dos grupos antes de criar as quedas.`);
  }
  if (lobbies.some((l) => l.teamIds.length < 2)) {
    throw new Error("É preciso pelo menos 2 equipes aprovadas em cada grupo.");
  }

  await prisma.$transaction(async (tx) => {
    for (const lobby of lobbies) {
      const existing = t.lobbyRounds.filter((r) => r.stage === "QUALIFYING" && r.groupId === lobby.groupId);
      const start = existing.reduce((max, r) => Math.max(max, r.number), 0);
      for (let i = 1; i <= count; i++) {
        await tx.lobbyRound.create({
          data: {
            tournamentId,
            stage: "QUALIFYING",
            number: start + i,
            groupId: lobby.groupId,
            entries: { create: lobby.teamIds.map((teamId) => ({ teamId })) },
          },
        });
      }
    }
    if (t.status !== "IN_PROGRESS") {
      await tx.tournament.update({ where: { id: tournamentId }, data: { status: "IN_PROGRESS" } });
    }
  });
}

/** Records a queda's match sheet (placement + kills for every team) and closes it. */
export async function saveLobbyRound(roundId: string, entries: EntryInput[]): Promise<void> {
  const round = await prisma.lobbyRound.findUniqueOrThrow({
    where: { id: roundId },
    include: { entries: true, tournament: true },
  });
  if (round.tournament.status === "FINISHED") {
    throw new Error("O campeonato já foi encerrado. Reabra o campeonato para corrigir uma queda.");
  }

  const expected = new Set(round.entries.map((e) => e.teamId));
  if (entries.length !== expected.size || entries.some((e) => !expected.has(e.teamId))) {
    throw new Error("A súmula precisa ter exatamente as equipes desta queda.");
  }
  const invalid = validateRoundEntries(entries);
  if (invalid) throw new Error(invalid);

  await prisma.$transaction([
    ...entries.map((e) =>
      prisma.lobbyEntry.update({
        where: { roundId_teamId: { roundId, teamId: e.teamId } },
        data: { placement: e.placement, kills: e.kills, points: entryPoints(e.placement, e.kills) },
      })
    ),
    prisma.lobbyRound.update({ where: { id: roundId }, data: { finished: true } }),
  ]);
}

export async function reopenLobbyRound(roundId: string): Promise<void> {
  const round = await prisma.lobbyRound.findUniqueOrThrow({ where: { id: roundId }, include: { tournament: true } });
  if (round.tournament.status === "FINISHED") {
    throw new Error("O campeonato já foi encerrado. Reabra o campeonato antes.");
  }
  if (round.stage === "QUALIFYING") {
    const finalExists = await prisma.lobbyRound.count({ where: { tournamentId: round.tournamentId, stage: "FINAL" } });
    if (finalExists > 0) throw new Error("A grande final já foi gerada com base nesta fase.");
  }
  await prisma.$transaction([
    prisma.lobbyEntry.updateMany({ where: { roundId }, data: { placement: null, kills: 0, points: 0 } }),
    prisma.lobbyRound.update({ where: { id: roundId }, data: { finished: false } }),
  ]);
}

/**
 * Builds the grand final: the best `topPerGroup` teams of each lobby, with a
 * fresh table (points reset), `count` quedas. Official finals hold up to 12 squads.
 */
export async function generateLobbyFinal(tournamentId: string, topPerGroup: number, count: number): Promise<void> {
  if (!Number.isInteger(topPerGroup) || topPerGroup < 1) throw new Error("Informe quantas equipes de cada grupo vão à final.");
  if (!Number.isInteger(count) || count < 1 || count > 20) throw new Error("Informe de 1 a 20 quedas para a final.");

  const t = await loadFreeFireTournament(tournamentId);
  if (t.status === "FINISHED") throw new Error("O campeonato já foi encerrado.");
  if (t.lobbyRounds.some((r) => r.stage === "FINAL")) throw new Error("A grande final já foi gerada.");

  const overview = await loadLobbyOverview(tournamentId);
  for (const section of overview.qualifying) {
    const label = section.group?.name ?? "A fase classificatória";
    if (section.rounds.length === 0) throw new Error(`${label} ainda não tem quedas.`);
    if (section.rounds.some((r) => !r.finished)) throw new Error(`${label} ainda tem quedas sem resultado.`);
  }

  const finalists = overview.qualifying.flatMap((s) => s.standings.slice(0, topPerGroup).map((row) => row.teamId));
  if (finalists.length < 2) throw new Error("É preciso pelo menos 2 equipes na final.");
  if (finalists.length > LOBBY_SIZE) {
    throw new Error(`A final comporta no máximo ${LOBBY_SIZE} equipes; com ${finalists.length} classificados, reduza quantas de cada grupo avançam.`);
  }

  await prisma.$transaction(async (tx) => {
    for (let number = 1; number <= count; number++) {
      await tx.lobbyRound.create({
        data: {
          tournamentId,
          stage: "FINAL",
          number,
          groupId: null,
          entries: { create: finalists.map((teamId) => ({ teamId })) },
        },
      });
    }
  });
}

/** Crowns the champion from the deciding table once every queda of that stage is done. */
export async function finishLobbyTournament(tournamentId: string): Promise<void> {
  const t = await loadFreeFireTournament(tournamentId);
  if (t.status === "FINISHED") throw new Error("O campeonato já foi encerrado.");

  const overview = await loadLobbyOverview(tournamentId);
  let deciding: LobbySection;
  if (overview.final) {
    deciding = overview.final;
  } else if (overview.qualifying.length === 1) {
    deciding = overview.qualifying[0];
  } else {
    throw new Error("Com mais de um grupo é preciso gerar a grande final para definir o campeão.");
  }

  if (deciding.rounds.length === 0) throw new Error("Ainda não há quedas.");
  if (deciding.rounds.some((r) => !r.finished)) throw new Error("Ainda há quedas sem resultado.");

  const [first, second, third] = deciding.standings;
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

/** Undoes `finishLobbyTournament` so a queda can be corrected. */
export async function reopenLobbyTournament(tournamentId: string): Promise<void> {
  const t = await loadFreeFireTournament(tournamentId);
  if (t.status !== "FINISHED") throw new Error("O campeonato não está encerrado.");
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { championTeamId: null, runnerUpTeamId: null, thirdPlaceTeamIds: [], status: "IN_PROGRESS" },
  });
}
