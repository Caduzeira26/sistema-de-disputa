import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeStandings } from "@/lib/bracket";
import { toDisplayMatches } from "@/lib/bracket-view";
import { BracketBoard } from "@/components/bracket/BracketBoard";
import { GroupFixtures } from "@/components/bracket/GroupFixtures";
import { StandingsTable } from "@/components/bracket/StandingsTable";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Em preparação",
  REGISTRATION_OPEN: "Inscrições abertas",
  REGISTRATION_CLOSED: "Inscrições encerradas",
  IN_PROGRESS: "Em andamento",
  FINISHED: "Encerrado",
};

const FORMAT_HAS_GROUPS = new Set(["GROUPS_SINGLE_ELIM", "GROUPS_DOUBLE_ELIM"]);

export default async function PublicTournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      teams: { where: { status: "APPROVED" }, orderBy: { name: "asc" } },
      groups: true,
      matches: { include: { venue: true } },
      championTeam: true,
    },
  });

  if (!tournament) notFound();

  const displayMatches = toDisplayMatches(tournament.matches, tournament.teams);
  const groupMatches = displayMatches.filter((m) => m.bracket === "GROUP");
  const eliminationMatches = displayMatches.filter((m) => m.bracket !== "GROUP");
  const hasGroups = FORMAT_HAS_GROUPS.has(tournament.format);
  const teamNames = Object.fromEntries(tournament.teams.map((t) => [t.id, t.name]));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">{tournament.name}</h1>
      {tournament.description && <p className="mt-2 text-slate-600">{tournament.description}</p>}
      <p className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
        {STATUS_LABEL[tournament.status]}
      </p>

      {tournament.championTeam && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          🏆 Campeão: {tournament.championTeam.name}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {tournament.status === "REGISTRATION_OPEN" && (
          <Link
            href={`/torneios/${tournament.slug}/inscricao`}
            className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Inscrever equipe
          </Link>
        )}
        {tournament.matches.length > 0 && (
          <Link
            href={`/torneios/${tournament.slug}/agenda`}
            className="inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver agenda
          </Link>
        )}
        {tournament.matches.length > 0 && (
          <Link
            href={`/torneios/${tournament.slug}/estatisticas`}
            className="inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Estatísticas
          </Link>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">
          Equipes confirmadas ({tournament.teams.length})
        </h2>
        {tournament.teams.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhuma equipe confirmada ainda.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tournament.teams.map((team) => (
              <li
                key={team.id}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900"
              >
                {team.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasGroups && groupMatches.length > 0 && (
        <div className="mt-10 flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-slate-900">Fase de grupos</h2>
          {tournament.groups.map((group) => {
            const teamIds = tournament.teams.filter((t) => t.groupId === group.id).map((t) => t.id);
            const standings = computeStandings(
              teamIds,
              tournament.matches.filter((m) => m.groupId === group.id),
              { win: tournament.pointsWin, draw: tournament.pointsDraw, loss: tournament.pointsLoss }
            );
            return (
              <div key={group.id} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <StandingsTable
                  title={group.name}
                  standings={standings}
                  teamNames={teamNames}
                  advanceCount={tournament.advancePerGroup ?? undefined}
                />
                <GroupFixtures
                  title="Partidas"
                  matches={groupMatches.filter((m) => m.groupId === group.id)}
                  publicSlug={tournament.slug}
                />
              </div>
            );
          })}
        </div>
      )}

      {eliminationMatches.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Chaveamento</h2>
          <BracketBoard matches={eliminationMatches} publicSlug={tournament.slug} />
        </div>
      )}
    </main>
  );
}
