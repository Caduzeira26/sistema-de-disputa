import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeTopScorers, computeCardRanking } from "@/lib/stats";
import { TopScorersTable } from "@/components/stats/TopScorersTable";
import { CardRankingTable } from "@/components/stats/CardRankingTable";

export default async function PublicStatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { championTeam: true },
  });
  if (!tournament) notFound();

  const [goals, cards] = await Promise.all([
    prisma.goal.findMany({ where: { match: { tournamentId: tournament.id } }, include: { player: true, team: true } }),
    prisma.card.findMany({ where: { match: { tournamentId: tournament.id } }, include: { player: true, team: true } }),
  ]);

  const scorers = computeTopScorers(
    goals.map((g) => ({ playerId: g.playerId, playerName: g.player.name, teamId: g.teamId, teamName: g.team.name }))
  );
  const cardRanking = computeCardRanking(
    cards.map((c) => ({ playerId: c.playerId, playerName: c.player.name, teamId: c.teamId, teamName: c.team.name, type: c.type }))
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href={`/torneios/${slug}`} className="text-sm text-slate-500 underline">
        ← {tournament.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Estatísticas</h1>

      {tournament.championTeam && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          🏆 Campeão: {tournament.championTeam.name}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-8">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Artilharia</h2>
          <TopScorersTable scorers={scorers} />
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Cartões</h2>
          <CardRankingTable cards={cardRanking} />
        </section>
      </div>
    </main>
  );
}
