import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSportFamily } from "@/lib/sport";

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
      homeTeam: { include: { players: true } },
      awayTeam: { include: { players: true } },
      goals: { include: { player: true, team: true }, orderBy: { minute: "asc" } },
      cards: { include: { player: true, team: true }, orderBy: { id: "asc" } },
      sets: { orderBy: { setNumber: "asc" } },
      baskets: { include: { player: true, team: true }, orderBy: [{ period: "asc" }, { id: "asc" }] },
      fouls: { include: { player: true, team: true }, orderBy: [{ period: "asc" }, { id: "asc" }] },
      tableTennisGames: { include: { sets: { orderBy: { setNumber: "asc" } } }, orderBy: { gameNumber: "asc" } },
    },
  });

  if (!match || match.tournament.slug !== slug) notFound();

  const family = getSportFamily(match.tournament.sportType);
  const playerName = (id: string) =>
    match.homeTeam?.players.find((p) => p.id === id)?.name ?? match.awayTeam?.players.find((p) => p.id === id)?.name ?? "?";

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

      {family === "TABLE_TENNIS_TIES" ? (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Jogos</h2>
          {match.tableTennisGames.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum jogo registrado.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {match.tableTennisGames.map((g) => (
                <li key={g.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <strong>Jogo {g.gameNumber}</strong> — {g.homePlayerIds.map(playerName).join(" / ")}{" "}
                  <span className="text-slate-400">x</span> {g.awayPlayerIds.map(playerName).join(" / ")}
                  {g.sets.length > 0 && (
                    <span className="text-slate-500">
                      {" "}
                      ({g.sets.map((s) => `${s.homePoints}-${s.awayPoints}`).join(", ")})
                    </span>
                  )}
                  {g.winnerSide && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      {(g.winnerSide === "HOME" ? g.homePlayerIds : g.awayPlayerIds).map(playerName).join(" / ")} venceu
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {family === "SETS_CARDS" ? (
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Sets</h2>
            {match.sets.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum set registrado.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {match.sets.map((s) => (
                  <li key={s.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                    <strong>Set {s.setNumber}</strong> — {s.homePoints} x {s.awayPoints}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : family === "PERIODS_FOULS" ? (
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Cestas</h2>
            {match.baskets.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma cesta registrada.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {match.baskets.map((b) => (
                  <li key={b.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                    <strong>{b.points}pt</strong> P{b.period} — {b.player.name} <span className="text-slate-400">({b.team.name})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
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
        )}

        {family === "PERIODS_FOULS" ? (
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Faltas</h2>
            {match.fouls.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma falta registrada.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {match.fouls.map((f) => (
                  <li key={f.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                    <strong>P{f.period}</strong> {f.player.name} <span className="text-slate-400">({f.team.name})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Cartões</h2>
            {match.cards.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum cartão registrado.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {match.cards.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${CARD_COLOR[c.type]}`}>{CARD_LABEL[c.type]}</span>
                    {c.minute !== null ? <strong>{c.minute}&apos;</strong> : <strong>Set {c.setNumber}</strong>}{" "}
                    {c.player.name} <span className="text-slate-400">({c.team.name})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
      )}
    </main>
  );
}
