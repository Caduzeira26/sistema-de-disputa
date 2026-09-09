import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MatchResultForm } from "@/components/bracket/MatchResultForm";
import { GoalForm } from "@/components/admin/GoalForm";
import { CardForm } from "@/components/admin/CardForm";
import { ReopenMatchButton } from "@/components/admin/ReopenMatchButton";
import { removeGoalAction, removeCardAction } from "@/lib/actions/sumula";

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
      cards: { include: { player: true, team: true }, orderBy: { minute: "asc" } },
    },
  });

  if (!match || match.tournament.organizerId !== session.user.id) notFound();

  const bothTeamsSet = !!match.homeTeam && !!match.awayTeam;

  return (
    <div>
      <Link href={`/admin/torneios/${match.tournamentId}`} className="text-sm text-slate-500 underline">
        ← Voltar ao torneio
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        {match.homeTeam?.name ?? "A definir"} <span className="text-slate-400">x</span> {match.awayTeam?.name ?? "A definir"}
      </h1>

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
      ) : (
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
                <GoalForm matchId={match.id} homeTeam={match.homeTeam!} awayTeam={match.awayTeam!} />
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
                <CardForm matchId={match.id} homeTeam={match.homeTeam!} awayTeam={match.awayTeam!} />
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
      )}
    </div>
  );
}
