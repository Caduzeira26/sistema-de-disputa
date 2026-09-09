import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeTopScorers, computeCardRanking } from "@/lib/stats";
import { TopScorersTable } from "@/components/stats/TopScorersTable";
import { CardRankingTable } from "@/components/stats/CardRankingTable";

export default async function TournamentStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const tournament = await prisma.tournament.findUnique({ where: { id }, include: { championTeam: true } });
  if (!tournament || tournament.organizerId !== session.user.id) notFound();

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
    <div>
      <Link href={`/admin/torneios/${tournament.id}`} className="text-sm text-slate-500 underline">
        ← Voltar ao torneio
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Estatísticas — {tournament.name}</h1>

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
    </div>
  );
}
