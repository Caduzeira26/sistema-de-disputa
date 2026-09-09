import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

const CARD_LABEL: Record<string, string> = { YELLOW: "Amarelo", RED: "Vermelho" };
const CARD_COLOR: Record<string, string> = { YELLOW: "bg-amber-100 text-amber-800", RED: "bg-red-100 text-red-800" };

export default async function PublicMatchSumulaPage({
  params,
}: {
  params: Promise<{ slug: string; matchId: string }>;
}) {
  const { slug, matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      homeTeam: true,
      awayTeam: true,
      goals: { include: { player: true, team: true }, orderBy: { minute: "asc" } },
      cards: { include: { player: true, team: true }, orderBy: { minute: "asc" } },
    },
  });

  if (!match || match.tournament.slug !== slug) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link href={`/torneios/${slug}`} className="text-sm text-slate-500 underline">
        ← {match.tournament.name}
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        {match.homeTeam?.name ?? "A definir"} <span className="text-slate-400">x</span> {match.awayTeam?.name ?? "A definir"}
      </h1>

      <div className="mt-3">
        {match.status === "FINISHED" ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
            Encerrada · {match.homeScore} x {match.awayScore}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">Ainda não realizada</span>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Gols</h2>
          {match.goals.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum gol registrado.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {match.goals.map((g) => (
                <li key={g.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <strong>{g.minute}&apos;</strong> {g.player.name} <span className="text-slate-400">({g.team.name})</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Cartões</h2>
          {match.cards.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum cartão registrado.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {match.cards.map((c) => (
                <li key={c.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${CARD_COLOR[c.type]}`}>{CARD_LABEL[c.type]}</span>
                  <strong>{c.minute}&apos;</strong> {c.player.name} <span className="text-slate-400">({c.team.name})</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
