import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VenueManager } from "@/components/admin/VenueManager";
import { AutoScheduleForm } from "@/components/admin/AutoScheduleForm";
import { MatchScheduleRow } from "@/components/admin/MatchScheduleRow";

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Agenda — {tournament.name}</h1>
          <Link href={`/admin/torneios/${tournament.id}`} className="text-sm text-slate-500 underline">
            Voltar ao torneio
          </Link>
        </div>
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
                  {tournament.matches.map((m) => {
                    const bracketLabel =
                      m.bracket === "GROUP" && m.groupId
                        ? (groupNameById[m.groupId] ?? "Grupo")
                        : BRACKET_LABEL[m.bracket];
                    const home = m.homeTeam?.name ?? "A definir";
                    const away = m.awayTeam?.name ?? "A definir";
                    return (
                      <MatchScheduleRow
                        key={m.id}
                        matchId={m.id}
                        label={`${bracketLabel} · R${m.round} · ${home} x ${away}`}
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
    </div>
  );
}
