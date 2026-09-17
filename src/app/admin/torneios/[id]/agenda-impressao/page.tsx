import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SPORT_LABELS } from "@/lib/sport";
import { TournamentHeaderLogo } from "@/components/TournamentBranding";
import { PrintButton } from "@/components/PrintButton";
import { assignGameNumbers, isByeMatch } from "@/lib/bracket/gameOrder";

const BRACKET_LABEL: Record<string, string> = {
  GROUP: "Grupo",
  WINNERS: "Chave principal",
  LOSERS: "Repescagem",
  GRAND_FINAL: "Grande final",
};

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default async function PrintAgendaPage({
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
      groups: true,
      matches: { include: { homeTeam: true, awayTeam: true, venue: true } },
    },
  });

  if (!tournament || tournament.organizerId !== session.user.id) notFound();

  const groupNameById = Object.fromEntries(tournament.groups.map((g) => [g.id, g.name]));
  const realMatches = tournament.matches.filter((m) => !isByeMatch(m));
  const gameNumbers = assignGameNumbers(tournament.matches);

  const rows = [...realMatches].sort((a, b) => {
    if (a.scheduledAt && b.scheduledAt) return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    if (a.scheduledAt) return -1;
    if (b.scheduledAt) return 1;
    return (gameNumbers.get(a.id) ?? 0) - (gameNumbers.get(b.id) ?? 0);
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 print:max-w-none print:p-4">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/admin/torneios/${tournament.id}/agenda`} className="text-sm text-slate-500 underline print:hidden">
          Voltar à agenda
        </Link>
        <PrintButton label="Imprimir agenda" />
      </div>

      <div className="flex items-center gap-3">
        <TournamentHeaderLogo logoUrl={tournament.logoUrl} tournamentName={tournament.name} />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{tournament.name}</h1>
          <p className="text-sm text-slate-500">{SPORT_LABELS[tournament.sportType]} — Agenda de jogos</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Este torneio ainda não tem partidas geradas.</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-left">
              <th className="py-2 pr-2 font-semibold text-slate-900">Jogo</th>
              <th className="py-2 pr-2 font-semibold text-slate-900">Data</th>
              <th className="py-2 pr-2 font-semibold text-slate-900">Horário</th>
              <th className="py-2 pr-2 font-semibold text-slate-900">Local</th>
              <th className="py-2 pr-2 font-semibold text-slate-900">Fase</th>
              <th className="py-2 font-semibold text-slate-900">Confronto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const bracketLabel = m.bracket === "GROUP" && m.groupId ? (groupNameById[m.groupId] ?? "Grupo") : BRACKET_LABEL[m.bracket];
              return (
                <tr key={m.id} className="border-b border-slate-200">
                  <td className="py-2 pr-2 font-medium text-slate-900">{gameNumbers.get(m.id) ?? "—"}</td>
                  <td className="py-2 pr-2 text-slate-700">{m.scheduledAt ? formatDate(m.scheduledAt) : "—"}</td>
                  <td className="py-2 pr-2 text-slate-700">{m.scheduledAt ? formatTime(m.scheduledAt) : "—"}</td>
                  <td className="py-2 pr-2 text-slate-700">{m.venue?.name ?? "—"}</td>
                  <td className="py-2 pr-2 text-slate-700">{bracketLabel}</td>
                  <td className="py-2 text-slate-900">
                    {m.homeTeam?.name ?? "A definir"} <span className="text-slate-400">x</span> {m.awayTeam?.name ?? "A definir"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
