import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MatchResultForm } from "@/components/bracket/MatchResultForm";
import { GoalForm } from "@/components/admin/GoalForm";
import { CardForm } from "@/components/admin/CardForm";
import { SetForm } from "@/components/admin/SetForm";
import { FinishSetsMatchButton } from "@/components/admin/FinishSetsMatchButton";
import { BasketForm } from "@/components/admin/BasketForm";
import { FoulForm } from "@/components/admin/FoulForm";
import { FinishPeriodsMatchButton } from "@/components/admin/FinishPeriodsMatchButton";
import { GameForm } from "@/components/admin/GameForm";
import { TableTennisSetForm } from "@/components/admin/TableTennisSetForm";
import { FinishTableTennisMatchButton } from "@/components/admin/FinishTableTennisMatchButton";
import { ReopenMatchButton } from "@/components/admin/ReopenMatchButton";
import {
  removeGoalAction,
  removeCardAction,
  removeSetAction,
  removeBasketAction,
  removeFoulAction,
  removeTableTennisGameAction,
  removeTableTennisSetAction,
} from "@/lib/actions/sumula";
import { getSportFamily } from "@/lib/sport";
import { countSetsWon } from "@/lib/sets";
import { sumPointsByTeam } from "@/lib/points";
import { countGamesWon } from "@/lib/tableTennis";
import { TournamentHeaderLogo, TournamentWatermark } from "@/components/TournamentBranding";

const CARD_LABEL: Record<string, string> = { YELLOW: "Amarelo", RED: "Vermelho" };
const CARD_COLOR: Record<string, string> = { YELLOW: "bg-amber-100 text-amber-800", RED: "bg-red-100 text-red-800" };

export default async function MatchSumulaPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { matchId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      homeTeam: { include: { players: { orderBy: { name: "asc" } } } },
      awayTeam: { include: { players: { orderBy: { name: "asc" } } } },
      goals: { include: { player: true, team: true }, orderBy: { minute: "asc" } },
      cards: { include: { player: true, team: true }, orderBy: { id: "asc" } },
      sets: { orderBy: { setNumber: "asc" } },
      baskets: { include: { player: true, team: true }, orderBy: [{ period: "asc" }, { id: "asc" }] },
      fouls: { include: { player: true, team: true }, orderBy: [{ period: "asc" }, { id: "asc" }] },
      tableTennisGames: { include: { sets: { orderBy: { setNumber: "asc" } } }, orderBy: { gameNumber: "asc" } },
    },
  });

  if (!match || match.tournament.organizerId !== session.user.id) notFound();

  const bothTeamsSet = !!match.homeTeam && !!match.awayTeam;
  const family = getSportFamily(match.tournament.sportType);
  const { home: homeSetsWon, away: awaySetsWon } = countSetsWon(match.sets);
  const { home: homePoints, away: awayPoints } = match.homeTeamId && match.awayTeamId
    ? sumPointsByTeam(match.baskets, match.homeTeamId, match.awayTeamId)
    : { home: 0, away: 0 };
  const { home: homeGamesWon, away: awayGamesWon } = countGamesWon(match.tableTennisGames);
  const playerName = (id: string) =>
    match.homeTeam?.players.find((p) => p.id === id)?.name ?? match.awayTeam?.players.find((p) => p.id === id)?.name ?? "?";

  // Súmula selectors only offer each team's current roster — a transferred-out
  // athlete's historical events (above) still resolve via the unfiltered lookups.
  const homeTeamActive = match.homeTeam
    ? { ...match.homeTeam, players: match.homeTeam.players.filter((p) => p.active) }
    : null;
  const awayTeamActive = match.awayTeam
    ? { ...match.awayTeam, players: match.awayTeam.players.filter((p) => p.active) }
    : null;

  return (
    <div className="relative overflow-hidden">
      <TournamentWatermark logoUrl={match.tournament.logoUrl} />
      <Link href={`/admin/torneios/${match.tournamentId}`} className="text-sm text-slate-500 underline">
        ← Voltar ao torneio
      </Link>

      <div className="mt-2 flex items-start gap-3">
        <TournamentHeaderLogo logoUrl={match.tournament.logoUrl} tournamentName={match.tournament.name} />
        <h1 className="text-2xl font-semibold text-slate-900">
          {match.homeTeam?.name ?? "A definir"} <span className="text-slate-400">x</span> {match.awayTeam?.name ?? "A definir"}
        </h1>
      </div>

      <div className="mt-3 flex items-center gap-3">
        {match.status === "FINISHED" ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
            Encerrada · {match.homeScore} x {match.awayScore}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">Em aberto</span>
        )}
      </div>

      {!bothTeamsSet ? (
        <p className="mt-4 text-sm text-slate-500">As duas equipes ainda não foram definidas para esta partida.</p>
      ) : family === "GOALS_CARDS" ? (
        <>
          <div className="mt-6">
            {match.status === "FINISHED" ? (
              <ReopenMatchButton matchId={match.id} />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">Placar final</h2>
                <MatchResultForm matchId={match.id} />
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Gols</h2>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <GoalForm matchId={match.id} homeTeam={homeTeamActive!} awayTeam={awayTeamActive!} />
              </div>
              {match.goals.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Nenhum gol registrado.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {match.goals.map((g) => (
                    <li key={g.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                      <span>
                        <strong>{g.minute}&apos;</strong> {g.player.name} <span className="text-slate-400">({g.team.name})</span>
                      </span>
                      <form action={removeGoalAction}>
                        <input type="hidden" name="goalId" value={g.id} />
                        <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                          Remover
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Cartões</h2>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <CardForm matchId={match.id} homeTeam={homeTeamActive!} awayTeam={awayTeamActive!} />
              </div>
              {match.cards.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Nenhum cartão registrado.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {match.cards.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${CARD_COLOR[c.type]}`}>{CARD_LABEL[c.type]}</span>
                        <strong>{c.minute}&apos;</strong> {c.player.name} <span className="text-slate-400">({c.team.name})</span>
                      </span>
                      <form action={removeCardAction}>
                        <input type="hidden" name="cardId" value={c.id} />
                        <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                          Remover
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : family === "SETS_CARDS" ? (
        <>
          <div className="mt-6">
            {match.status === "FINISHED" ? (
              <ReopenMatchButton matchId={match.id} />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">
                  Sets · {homeSetsWon} x {awaySetsWon}
                </h2>
                <SetForm matchId={match.id} nextSetNumber={match.sets.length + 1} />
                {match.sets.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">Nenhum set registrado.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {match.sets.map((s) => (
                      <li key={s.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                        <span>
                          <strong>Set {s.setNumber}</strong> — {s.homePoints} x {s.awayPoints}
                        </span>
                        <form action={removeSetAction}>
                          <input type="hidden" name="setId" value={s.id} />
                          <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                            Remover
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  <FinishSetsMatchButton matchId={match.id} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <section>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Cartões</h2>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <CardForm matchId={match.id} homeTeam={homeTeamActive!} awayTeam={awayTeamActive!} mode="set" />
              </div>
              {match.cards.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Nenhum cartão registrado.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {match.cards.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${CARD_COLOR[c.type]}`}>{CARD_LABEL[c.type]}</span>
                        <strong>Set {c.setNumber}</strong> {c.player.name} <span className="text-slate-400">({c.team.name})</span>
                      </span>
                      <form action={removeCardAction}>
                        <input type="hidden" name="cardId" value={c.id} />
                        <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                          Remover
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : family === "PERIODS_FOULS" ? (
        <>
          <div className="mt-6">
            {match.status === "FINISHED" ? (
              <ReopenMatchButton matchId={match.id} />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">
                  Pontos · {homePoints} x {awayPoints}
                </h2>
                <FinishPeriodsMatchButton matchId={match.id} />
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Cestas</h2>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <BasketForm matchId={match.id} homeTeam={homeTeamActive!} awayTeam={awayTeamActive!} />
              </div>
              {match.baskets.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Nenhuma cesta registrada.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {match.baskets.map((b) => (
                    <li key={b.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                      <span>
                        <strong>{b.points}pt</strong> P{b.period} — {b.player.name} <span className="text-slate-400">({b.team.name})</span>
                      </span>
                      <form action={removeBasketAction}>
                        <input type="hidden" name="basketId" value={b.id} />
                        <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                          Remover
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Faltas</h2>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <FoulForm matchId={match.id} homeTeam={homeTeamActive!} awayTeam={awayTeamActive!} />
              </div>
              {match.fouls.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Nenhuma falta registrada.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {match.fouls.map((f) => (
                    <li key={f.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                      <span>
                        <strong>P{f.period}</strong> {f.player.name} <span className="text-slate-400">({f.team.name})</span>
                      </span>
                      <form action={removeFoulAction}>
                        <input type="hidden" name="foulId" value={f.id} />
                        <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                          Remover
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : family === "TABLE_TENNIS_TIES" ? (
        <>
          <div className="mt-6">
            {match.status === "FINISHED" ? (
              <ReopenMatchButton matchId={match.id} />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">
                  Jogos · {homeGamesWon} x {awayGamesWon}
                </h2>
                <GameForm matchId={match.id} homeTeam={homeTeamActive!} awayTeam={awayTeamActive!} />
                <FinishTableTennisMatchButton matchId={match.id} />
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-4">
            {match.tableTennisGames.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum jogo registrado.</p>
            ) : (
              match.tableTennisGames.map((g) => {
                const { home: gHome, away: gAway } = countSetsWon(g.sets);
                return (
                  <div key={g.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Jogo {g.gameNumber} · {g.homePlayerIds.map(playerName).join(" / ")}{" "}
                        <span className="text-slate-400">x</span> {g.awayPlayerIds.map(playerName).join(" / ")}
                        {" — "}
                        {gHome} x {gAway}
                        {g.winnerSide && (
                          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            {g.winnerSide === "HOME" ? g.homePlayerIds.map(playerName).join(" / ") : g.awayPlayerIds.map(playerName).join(" / ")} venceu
                          </span>
                        )}
                      </h3>
                      <form action={removeTableTennisGameAction}>
                        <input type="hidden" name="gameId" value={g.id} />
                        <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                          Remover jogo
                        </button>
                      </form>
                    </div>

                    <div className="mt-2">
                      <TableTennisSetForm gameId={g.id} nextSetNumber={g.sets.length + 1} />
                    </div>

                    {g.sets.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {g.sets.map((s) => (
                          <li key={s.id} className="flex items-center justify-between text-sm text-slate-600">
                            <span>
                              Set {s.setNumber} — {s.homePoints} x {s.awayPoints}
                            </span>
                            <form action={removeTableTennisSetAction}>
                              <input type="hidden" name="setId" value={s.id} />
                              <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                                Remover
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          A súmula para esta modalidade ainda não foi implementada.
        </p>
      )}
    </div>
  );
}
