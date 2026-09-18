import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  computeTopScorers,
  computeCardRanking,
  computeTopPointScorers,
  computeFoulRanking,
  computeGameWinRanking,
  computeGoalkeeperRanking,
  type TeamMatchConceded,
} from "@/lib/stats";
import { TopScorersTable } from "@/components/stats/TopScorersTable";
import { CardRankingTable } from "@/components/stats/CardRankingTable";
import { TopPointScorersTable } from "@/components/stats/TopPointScorersTable";
import { FoulRankingTable } from "@/components/stats/FoulRankingTable";
import { GameWinRankingTable } from "@/components/stats/GameWinRankingTable";
import { GoalkeeperRankingTable } from "@/components/stats/GoalkeeperRankingTable";
import { getSportFamily } from "@/lib/sport";
import { isByeMatch } from "@/lib/bracket/gameOrder";
import { TournamentHeaderLogo, TournamentWatermark } from "@/components/TournamentBranding";

export default async function PublicStatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { championTeam: true },
  });
  if (!tournament) notFound();

  const family = getSportFamily(tournament.sportType);

  const [goals, cards, baskets, fouls] = await Promise.all([
    prisma.goal.findMany({ where: { match: { tournamentId: tournament.id } }, include: { player: true, team: true } }),
    prisma.card.findMany({ where: { match: { tournamentId: tournament.id } }, include: { player: true, team: true } }),
    prisma.basket.findMany({ where: { match: { tournamentId: tournament.id } }, include: { player: true, team: true } }),
    prisma.foul.findMany({ where: { match: { tournamentId: tournament.id } }, include: { player: true, team: true } }),
  ]);

  const scorers = computeTopScorers(
    goals.map((g) => ({ playerId: g.playerId, playerName: g.player.name, teamId: g.teamId, teamName: g.team.name }))
  );
  const cardRanking = computeCardRanking(
    cards.map((c) => ({ playerId: c.playerId, playerName: c.player.name, teamId: c.teamId, teamName: c.team.name, type: c.type }))
  );
  const pointScorers = computeTopPointScorers(
    baskets.map((b) => ({ playerId: b.playerId, playerName: b.player.name, teamId: b.teamId, teamName: b.team.name, points: b.points }))
  );
  const foulRanking = computeFoulRanking(
    fouls.map((f) => ({ playerId: f.playerId, playerName: f.player.name, teamId: f.teamId, teamName: f.team.name }))
  );

  let goalkeeperRanking: ReturnType<typeof computeGoalkeeperRanking> = [];
  if (family === "GOALS_CARDS") {
    const [goalkeepers, finishedMatches] = await Promise.all([
      prisma.player.findMany({
        where: { isGoalkeeper: true, active: true, team: { tournamentId: tournament.id } },
        include: { team: true },
      }),
      prisma.match.findMany({
        where: { tournamentId: tournament.id, status: "FINISHED" },
        select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true, status: true },
      }),
    ]);
    const teamMatches: TeamMatchConceded[] = finishedMatches.filter((m) => !isByeMatch(m)).flatMap((m) => [
      { teamId: m.homeTeamId!, goalsConceded: m.awayScore! },
      { teamId: m.awayTeamId!, goalsConceded: m.homeScore! },
    ]);
    goalkeeperRanking = computeGoalkeeperRanking(
      goalkeepers.map((g) => ({ playerId: g.id, playerName: g.name, teamId: g.teamId, teamName: g.team.name })),
      teamMatches
    );
  }

  const games = await prisma.tableTennisGame.findMany({ where: { match: { tournamentId: tournament.id } } });
  const gamePlayerIds = [...new Set(games.flatMap((g) => [...g.homePlayerIds, ...g.awayPlayerIds]))];
  const gamePlayers = await prisma.player.findMany({ where: { id: { in: gamePlayerIds } }, include: { team: true } });
  const gamePlayerById = new Map(gamePlayers.map((p) => [p.id, { id: p.id, name: p.name, teamId: p.teamId, teamName: p.team.name }]));
  const gameWinRanking = computeGameWinRanking(
    games.map((g) => ({
      winnerSide: g.winnerSide,
      homePlayers: g.homePlayerIds.map((id) => gamePlayerById.get(id)).filter((p) => p !== undefined),
      awayPlayers: g.awayPlayerIds.map((id) => gamePlayerById.get(id)).filter((p) => p !== undefined),
    }))
  );

  return (
    <main className="relative mx-auto w-full max-w-3xl flex-1 overflow-hidden px-4 py-10">
      <TournamentWatermark logoUrl={tournament.logoUrl} />
      <Link href={`/torneios/${slug}`} className="text-sm text-slate-500 underline">
        ← {tournament.name}
      </Link>
      <div className="mt-2 flex items-start gap-3">
        <TournamentHeaderLogo logoUrl={tournament.logoUrl} tournamentName={tournament.name} />
        <h1 className="text-2xl font-semibold text-slate-900">Estatísticas</h1>
      </div>

      {tournament.championTeam && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          🏆 Campeão: {tournament.championTeam.name}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-8">
        {family === "GOALS_CARDS" && (
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Artilharia</h2>
            <TopScorersTable scorers={scorers} />
          </section>
        )}

        {family === "GOALS_CARDS" && (
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Melhor goleiro</h2>
            <p className="mb-2 text-xs text-slate-400">Média de gols sofridos por partida (menor é melhor).</p>
            <GoalkeeperRankingTable goalkeepers={goalkeeperRanking} />
          </section>
        )}

        {family === "PERIODS_FOULS" && (
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Cestinhas</h2>
            <TopPointScorersTable scorers={pointScorers} />
          </section>
        )}

        {family === "PERIODS_FOULS" && (
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Faltas</h2>
            <FoulRankingTable fouls={foulRanking} />
          </section>
        )}

        {family === "TABLE_TENNIS_TIES" && (
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Jogos vencidos</h2>
            <GameWinRankingTable standings={gameWinRanking} />
          </section>
        )}

        {(family === "GOALS_CARDS" || family === "SETS_CARDS") && (
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Cartões</h2>
            <CardRankingTable cards={cardRanking} />
          </section>
        )}
      </div>
    </main>
  );
}
