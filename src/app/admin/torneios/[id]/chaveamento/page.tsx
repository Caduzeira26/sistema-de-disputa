import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeStandings } from "@/lib/bracket";
import { toDisplayMatches } from "@/lib/bracket-view";
import { SPORT_LABELS } from "@/lib/sport";
import { BracketBoard } from "@/components/bracket/BracketBoard";
import { GroupFixtures } from "@/components/bracket/GroupFixtures";
import { StandingsTable } from "@/components/bracket/StandingsTable";
import { TournamentHeaderLogo } from "@/components/TournamentBranding";
import { PrintButton } from "@/components/PrintButton";

const FORMAT_HAS_GROUPS = new Set(["GROUPS_SINGLE_ELIM", "GROUPS_DOUBLE_ELIM"]);

export default async function PrintBracketPage({
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
      teams: { where: { status: "APPROVED" }, orderBy: { name: "asc" } },
      groups: true,
      matches: { include: { venue: true } },
      championTeam: true,
    },
  });

  if (!tournament || tournament.organizerId !== session.user.id) notFound();

  const displayMatches = toDisplayMatches(tournament.matches, tournament.teams);
  const groupMatches = displayMatches.filter((m) => m.bracket === "GROUP");
  const eliminationMatches = displayMatches.filter((m) => m.bracket !== "GROUP");
  const hasGroups = FORMAT_HAS_GROUPS.has(tournament.format);
  const teamNames = Object.fromEntries(tournament.teams.map((t) => [t.id, t.name]));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 print:max-w-none print:p-4">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/admin/torneios/${tournament.id}`} className="text-sm text-slate-500 underline print:hidden">
          Voltar ao torneio
        </Link>
        <PrintButton label="Imprimir chaveamento" />
      </div>

      <div className="flex items-center gap-3">
        <TournamentHeaderLogo logoUrl={tournament.logoUrl} tournamentName={tournament.name} />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{tournament.name}</h1>
          <p className="text-sm text-slate-500">{SPORT_LABELS[tournament.sportType]} — Chaveamento</p>
        </div>
      </div>

      {tournament.matches.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Este torneio ainda não tem chaveamento gerado.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {hasGroups && groupMatches.length > 0 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-slate-900">Fase de grupos</h2>
              {tournament.groups.map((group) => {
                const teamIds = tournament.teams.filter((t) => t.groupId === group.id).map((t) => t.id);
                const standings = computeStandings(
                  teamIds,
                  tournament.matches.filter((m) => m.groupId === group.id),
                  { win: tournament.pointsWin, draw: tournament.pointsDraw, loss: tournament.pointsLoss }
                );
                return (
                  <div key={group.id} className="grid grid-cols-1 gap-4 break-inside-avoid lg:grid-cols-2">
                    <StandingsTable
                      title={group.name}
                      standings={standings}
                      teamNames={teamNames}
                      advanceCount={tournament.advancePerGroup ?? undefined}
                    />
                    <GroupFixtures title="Partidas" matches={groupMatches.filter((m) => m.groupId === group.id)} />
                  </div>
                );
              })}
            </div>
          )}

          {eliminationMatches.length > 0 && (
            <div className="break-inside-avoid">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Chaveamento</h2>
              <BracketBoard matches={eliminationMatches} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
