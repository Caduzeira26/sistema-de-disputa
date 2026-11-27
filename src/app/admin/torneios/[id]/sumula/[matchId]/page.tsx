import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PrintButton } from "@/components/PrintButton";
import { assignGameNumbers } from "@/lib/bracket/gameOrder";
import { PrintableSumula, type SumulaTeam } from "@/components/sumula/PrintableSumula";
import { sumulaPhaseLabel, toSumulaTeam } from "@/lib/sumulaPrint";

/**
 * Súmula oficial da partida para imprimir, já preenchida com o que se sabe antes do jogo
 * (equipes, jogadores com RG/CPF, data, horário e local). O mesário completa à mão e depois
 * passa o resultado para a súmula do sistema.
 */
export default async function PrintMatchSumulaPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { matchId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const playerInclude = {
    players: { where: { active: true }, orderBy: [{ shirtNumber: "asc" as const }, { name: "asc" as const }], include: { athlete: true } },
  };
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true, venue: true, group: true, homeTeam: { include: playerInclude }, awayTeam: { include: playerInclude } },
  });
  if (!match || match.tournament.organizerId !== session.user.id) notFound();

  const siblings = await prisma.match.findMany({
    where: { tournamentId: match.tournamentId },
    select: { id: true, bracket: true, round: true, position: true, status: true, homeTeamId: true, awayTeamId: true, winnerNextMatchId: true, loserNextMatchId: true },
  });
  const gameNumber = assignGameNumbers(siblings).get(match.id) ?? null;
  const teams: [SumulaTeam | null, SumulaTeam | null] = [
    match.homeTeam ? toSumulaTeam(match.homeTeam) : null,
    match.awayTeam ? toSumulaTeam(match.awayTeam) : null,
  ];

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 py-6 print:max-w-none print:p-0">
      <style>{`@page { size: A4 portrait; margin: 10mm; }`}</style>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={`/admin/torneios/${match.tournamentId}/partidas/${match.id}`} className="text-sm text-slate-500 underline">
          Voltar à súmula
        </Link>
        <div className="flex items-center gap-3">
          <Link href={`/admin/torneios/${match.tournamentId}/sumula-em-branco`} className="text-sm text-slate-500 underline">
            Súmula em branco
          </Link>
          <PrintButton label="Imprimir súmula" />
        </div>
      </div>
      <PrintableSumula
        sportType={match.tournament.sportType}
        tournament={match.tournament}
        teams={teams}
        match={{
          gameNumber,
          phase: sumulaPhaseLabel(match.bracket, match.round, match.group?.name ?? null),
          date: match.scheduledAt ? match.scheduledAt.toLocaleDateString("pt-BR") : null,
          time: match.scheduledAt
            ? match.scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            : null,
          venue: match.venue?.name ?? null,
          knockout: match.bracket !== "GROUP",
        }}
      />
    </main>
  );
}
