import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VenueManager } from "@/components/admin/VenueManager";
import { AutoScheduleForm } from "@/components/admin/AutoScheduleForm";
import { MatchScheduleRow } from "@/components/admin/MatchScheduleRow";
import { BrandFooter } from "@/components/BrandFooter";
import { assignGameNumbers, topologicalMatchOrder } from "@/lib/bracket/gameOrder";

const BRACKET_LABEL: Record<string, string> = {
  GROUP: "Grupo",
  WINNERS: "Chave principal",
  LOSERS: "Repescagem",
  GRAND_FINAL: "Grande final",
};

export default async function TournamentAgendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      venues: { orderBy: { name: "asc" } },
      groups: true,
      matches: {
        orderBy: [{ round: "asc" }, { position: "asc" }],
        include: { homeTeam: true, awayTeam: true, group: true },
      },
    },
  });

  if (!tournament || tournament.organizerId !== session.user.id) notFound();

  const groupNameById = Object.fromEntries(tournament.groups.map((g) => [g.id, g.name]));
  const gameNumbers = assignGameNumbers(tournament.matches);
  const orderedMatches = topologicalMatchOrder(tournament.matches);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Agenda — {tournament.name}</h1>
          <Link href={`/admin/torneios/${tournament.id}`} className="text-sm text-slate-500 underline">
            Voltar ao torneio
          </Link>
        </div>
        <Link
          href={`/admin/torneios/${tournament.id}/agenda-impressao`}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Imprimir agenda
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <VenueManager tournamentId={tournament.id} venues={tournament.venues} />
        </div>

        <AutoScheduleForm tournamentId={tournament.id} venues={tournament.venues} />

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Partidas ({tournament.matches.length})</h2>
          {tournament.matches.length === 0 ? (
            <p className="text-sm text-slate-500">Gere o chaveamento antes de montar a agenda.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Partida</th>
                    <th className="px-3 py-2 font-medium">Data / horário / local</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orderedMatches.map((m) => {
                    const bracketLabel =
                      m.bracket === "GROUP" && m.groupId
                        ? (groupNameById[m.groupId] ?? "Grupo")
                        : BRACKET_LABEL[m.bracket];
                    const home = m.homeTeam?.name ?? "A definir";
                    const away = m.awayTeam?.name ?? "A definir";
                    const gameNumber = gameNumbers.get(m.id);
                    const gamePrefix = gameNumber ? `Jogo ${gameNumber} · ` : "";
                    const isFinished = m.status === "FINISHED";
                    const homeWon = isFinished && m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore;
                    const awayWon = isFinished && m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore;
                    return (
                      <MatchScheduleRow
                        key={m.id}
                        matchId={m.id}
                        label={
                          <span>
                            {gamePrefix}
                            {bracketLabel} · R{m.round} ·{" "}
                            <span className={homeWon ? "font-semibold text-slate-900" : isFinished ? "text-slate-500" : ""}>
                              {home}
                              {isFinished && <span className="ml-1 tabular-nums">{m.homeScore}</span>}
                            </span>{" "}
                            <span className="text-slate-400">x</span>{" "}
                            <span className={awayWon ? "font-semibold text-slate-900" : isFinished ? "text-slate-500" : ""}>
                              {isFinished && <span className="mr-1 tabular-nums">{m.awayScore}</span>}
                              {away}
                            </span>
                            {isFinished && <span className="ml-1 text-emerald-600">· Encerrada</span>}
                          </span>
                        }
                        scheduledAt={m.scheduledAt}
                        venueId={m.venueId}
                        venues={tournament.venues}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <BrandFooter />
    </div>
  );
}
