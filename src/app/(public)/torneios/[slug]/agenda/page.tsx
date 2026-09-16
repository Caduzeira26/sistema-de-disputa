import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BrandFooter } from "@/components/BrandFooter";
import { assignGameNumbers } from "@/lib/bracket/gameOrder";

const BRACKET_LABEL: Record<string, string> = {
  GROUP: "Grupo",
  WINNERS: "Chave principal",
  LOSERS: "Repescagem",
  GRAND_FINAL: "Grande final",
};

function formatDay(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default async function PublicAgendaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      groups: true,
      matches: {
        include: { homeTeam: true, awayTeam: true, venue: true },
        orderBy: [{ scheduledAt: "asc" }],
      },
    },
  });

  if (!tournament) notFound();

  const groupNameById = Object.fromEntries(tournament.groups.map((g) => [g.id, g.name]));
  const gameNumbers = assignGameNumbers(tournament.matches);
  const scheduled = tournament.matches.filter((m) => m.scheduledAt);
  const unscheduled = tournament.matches.filter((m) => !m.scheduledAt);

  const byDay = new Map<string, typeof scheduled>();
  for (const m of scheduled) {
    const key = m.scheduledAt!.toDateString();
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(m);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href={`/torneios/${slug}`} className="text-sm text-slate-500 underline">
        ← {tournament.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Agenda</h1>

      {scheduled.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">A agenda ainda não foi definida.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {[...byDay.entries()].map(([key, matches]) => (
            <div key={key}>
              <h2 className="mb-2 text-sm font-semibold capitalize text-slate-700">{formatDay(matches[0].scheduledAt!)}</h2>
              <div className="flex flex-col gap-2">
                {matches.map((m) => {
                  const bracketLabel = m.bracket === "GROUP" && m.groupId ? groupNameById[m.groupId] : BRACKET_LABEL[m.bracket];
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {m.homeTeam?.name ?? "A definir"} <span className="text-slate-400">x</span> {m.awayTeam?.name ?? "A definir"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {gameNumbers.has(m.id) && <span className="font-medium text-slate-600">Jogo {gameNumbers.get(m.id)} · </span>}
                          {bracketLabel}
                        </p>
                      </div>
                      <div className="text-right text-sm text-slate-600">
                        <p className="font-medium">{formatTime(m.scheduledAt!)}</p>
                        {m.venue && <p className="text-xs text-slate-400">{m.venue.name}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {unscheduled.length > 0 && (
        <p className="mt-6 text-xs text-slate-400">
          {unscheduled.length} partida(s) ainda sem data/horário definidos.
        </p>
      )}

      <BrandFooter />
    </main>
  );
}
