import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateTournamentStatus } from "@/lib/actions/tournaments";
import { setTeamStatus } from "@/lib/actions/teams";
import { DeleteTeamButton } from "@/components/admin/DeleteTeamButton";
import { GenerateBracketButton, GenerateEliminationButton, ResetBracketButton } from "@/components/admin/GenerateBracketButton";
import { BracketBoard } from "@/components/bracket/BracketBoard";
import { GroupFixtures } from "@/components/bracket/GroupFixtures";
import { StandingsTable } from "@/components/bracket/StandingsTable";
import { FinalPodium } from "@/components/bracket/FinalPodium";
import { toDisplayMatches } from "@/lib/bracket-view";
import { computeStandings } from "@/lib/bracket";
import { SPORT_LABELS, getSportFamily } from "@/lib/sport";
import { TournamentLogoForm } from "@/components/admin/TournamentLogoForm";
import { TournamentDatesForm } from "@/components/admin/TournamentDatesForm";
import { TournamentFeeForm } from "@/components/admin/TournamentFeeForm";
import { TournamentTransferDeadlineForm } from "@/components/admin/TournamentTransferDeadlineForm";
import { TransferRequestsList } from "@/components/admin/TransferRequestsList";
import { TournamentHeaderLogo, TournamentWatermark } from "@/components/TournamentBranding";
import { formatTournamentDateRange } from "@/lib/formatDateRange";
import { getPlanLimits } from "@/lib/plans";

/** Bracket generation for a large field of teams can take longer than the
 *  platform's default function timeout — raises it for every Server Action
 *  on this page (see BRACKET_TRANSACTION_OPTIONS in lib/services/bracket.ts
 *  for the matching Prisma transaction timeout). */
export const maxDuration = 40;

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "REGISTRATION_OPEN", label: "Inscrições abertas" },
  { value: "REGISTRATION_CLOSED", label: "Inscrições encerradas" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "FINISHED", label: "Encerrado" },
];

const TEAM_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

const TEAM_STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
};

const FORMAT_HAS_GROUPS = new Set(["GROUPS_SINGLE_ELIM", "GROUPS_DOUBLE_ELIM"]);

export default async function TournamentDetailPage({
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
      teams: { orderBy: { createdAt: "asc" }, include: { players: true } },
      groups: true,
      matches: { include: { venue: true } },
      championTeam: true,
      runnerUpTeam: true,
    },
  });

  if (!tournament || tournament.organizerId !== session.user.id) notFound();
  const thirdPlaceTeams = tournament.teams.filter((t) => tournament.thirdPlaceTeamIds.includes(t.id));

  const limits = await getPlanLimits(session.user.id);
  const pendingTransferRequests = limits.canManageAthleteRegistry
    ? await prisma.transferRequest.findMany({
        where: { tournamentId: tournament.id, status: "PENDING" },
        include: { athlete: true, fromTeam: true, toTeam: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const approvedTeams = tournament.teams.filter((t) => t.status === "APPROVED");
  const displayMatches = toDisplayMatches(tournament.matches, tournament.teams);
  const groupMatches = displayMatches.filter((m) => m.bracket === "GROUP");
  const eliminationMatches = displayMatches.filter((m) => m.bracket !== "GROUP");

  const hasGroups = FORMAT_HAS_GROUPS.has(tournament.format);
  const groupMatchesRaw = tournament.matches.filter((m) => m.bracket === "GROUP");
  const allGroupMatchesFinished = groupMatches.length > 0 && groupMatches.every((m) => m.status === "FINISHED");
  const canGenerateBracket = tournament.matches.length === 0 && approvedTeams.length >= 2;
  const canGenerateElimination = hasGroups && allGroupMatchesFinished && eliminationMatches.length === 0;

  const teamNames = Object.fromEntries(tournament.teams.map((t) => [t.id, t.name]));
  const family = getSportFamily(tournament.sportType);
  const quickResultEntry = family === "GOALS_CARDS";

  return (
    <div className="relative overflow-hidden">
      <TournamentWatermark logoUrl={tournament.logoUrl} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <TournamentHeaderLogo logoUrl={tournament.logoUrl} tournamentName={tournament.name} />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{tournament.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{SPORT_LABELS[tournament.sportType]}</p>
            {formatTournamentDateRange(tournament.startDate, tournament.endDate) && (
              <p className="mt-1 text-sm text-slate-500">
                {formatTournamentDateRange(tournament.startDate, tournament.endDate)}
              </p>
            )}
            <p className="mt-1 text-sm text-slate-500">
              Link público:{" "}
              <Link href={`/torneios/${tournament.slug}`} className="underline" target="_blank">
                /torneios/{tournament.slug}
              </Link>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Ficha de inscrição (compartilhe com as equipes):{" "}
              <Link href={`/torneios/${tournament.slug}/inscricao`} className="underline" target="_blank">
                /torneios/{tournament.slug}/inscricao
              </Link>
            </p>
            <div className="mt-1 flex gap-3">
              <Link href={`/admin/torneios/${tournament.id}/agenda`} className="text-sm text-slate-600 underline">
                Gerenciar agenda e locais
              </Link>
              <Link href={`/admin/torneios/${tournament.id}/estatisticas`} className="text-sm text-slate-600 underline">
                Estatísticas
              </Link>
            </div>
          </div>
        </div>

        <form action={updateTournamentStatus} className="flex items-center gap-2">
          <input type="hidden" name="tournamentId" value={tournament.id} />
          <select
            name="status"
            defaultValue={tournament.status}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Atualizar
          </button>
        </form>
      </div>

      <FinalPodium champion={tournament.championTeam} runnerUp={tournament.runnerUpTeam} thirdPlace={thirdPlaceTeams} />

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <TournamentLogoForm tournamentId={tournament.id} logoUrl={tournament.logoUrl} />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Datas do torneio</h2>
        <TournamentDatesForm tournamentId={tournament.id} startDate={tournament.startDate} endDate={tournament.endDate} />
      </div>

      {limits.canChargeRegistration ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Inscrição paga (PIX)</h2>
          <TournamentFeeForm tournamentId={tournament.id} registrationFeeCents={tournament.registrationFeeCents} />
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          Cobrança de inscrição por PIX é exclusiva dos planos Pro e Liga.{" "}
          <Link href="/planos" className="underline">
            Ver planos
          </Link>
          .
        </div>
      )}

      {limits.canManageAthleteRegistry && (
        <>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Prazo de transferências</h2>
            <TournamentTransferDeadlineForm
              tournamentId={tournament.id}
              transferDeadline={tournament.transferDeadline}
            />
            <p className="mt-2 text-sm text-slate-500">
              Página pública de solicitação:{" "}
              <Link href={`/torneios/${tournament.slug}/transferencias`} className="underline" target="_blank">
                /torneios/{tournament.slug}/transferencias
              </Link>
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              Solicitações de transferência pendentes ({pendingTransferRequests.length})
            </h2>
            <TransferRequestsList requests={pendingTransferRequests} />
          </div>
        </>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Equipes inscritas ({tournament.teams.length})
        </h2>

        {tournament.teams.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Nenhuma equipe se inscreveu ainda. Compartilhe o link público acima.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Equipe</th>
                  <th className="px-4 py-2 font-medium">Responsável</th>
                  <th className="px-4 py-2 font-medium">Jogadores</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tournament.teams.map((team) => (
                  <tr key={team.id}>
                    <td className="px-4 py-2 font-medium text-slate-900">{team.name}</td>
                    <td className="px-4 py-2 text-slate-600">{team.managerName}</td>
                    <td className="px-4 py-2 text-slate-600">{team.players.length}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${TEAM_STATUS_BADGE[team.status]}`}
                      >
                        {TEAM_STATUS_LABEL[team.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap items-center gap-3">
                        {team.status !== "APPROVED" && (
                          <form action={setTeamStatus}>
                            <input type="hidden" name="teamId" value={team.id} />
                            <input type="hidden" name="status" value="APPROVED" />
                            <button type="submit" className="text-sm text-emerald-700 hover:text-emerald-900">
                              Aprovar
                            </button>
                          </form>
                        )}
                        {team.status !== "REJECTED" && (
                          <form action={setTeamStatus}>
                            <input type="hidden" name="teamId" value={team.id} />
                            <input type="hidden" name="status" value="REJECTED" />
                            <button type="submit" className="text-sm text-amber-700 hover:text-amber-900">
                              Rejeitar
                            </button>
                          </form>
                        )}
                        <Link
                          href={`/admin/torneios/${tournament.id}/equipes/${team.id}/editar`}
                          className="text-sm text-slate-600 hover:text-slate-900"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/torneios/${tournament.slug}/inscricao/equipe/${team.id}`}
                          className="text-sm text-slate-600 hover:text-slate-900"
                          target="_blank"
                        >
                          Completar equipe
                        </Link>
                        <DeleteTeamButton teamId={team.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Chaveamento</h2>
          {tournament.matches.length > 0 && (
            <Link
              href={`/admin/torneios/${tournament.id}/chaveamento`}
              target="_blank"
              className="text-sm text-slate-500 underline hover:text-slate-700"
            >
              Imprimir chaveamento
            </Link>
          )}
        </div>

        {canGenerateBracket && (
          <div className="mt-3">
            <GenerateBracketButton
              tournamentId={tournament.id}
              label={hasGroups ? "Gerar fase de grupos" : "Gerar chaveamento"}
            />
          </div>
        )}

        {tournament.matches.length === 0 && !canGenerateBracket && (
          <p className="mt-3 text-sm text-slate-500">
            É preciso pelo menos 2 equipes aprovadas para gerar o chaveamento.
          </p>
        )}

        {tournament.matches.length > 0 && (
          <div className="mt-3">
            <ResetBracketButton tournamentId={tournament.id} />
          </div>
        )}

        {hasGroups && groupMatches.length > 0 && (
          <div className="mt-4 flex flex-col gap-6">
            {tournament.groups.map((group) => {
              const teamIds = tournament.teams.filter((t) => t.groupId === group.id).map((t) => t.id);
              const standings = computeStandings(
                teamIds,
                groupMatchesRaw.filter((m) => m.groupId === group.id),
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
                    editable
                    quickResultEntry={quickResultEntry}
                    tournamentId={tournament.id}
                  />
                </div>
              );
            })}

            {canGenerateElimination && (
              <div>
                <GenerateEliminationButton tournamentId={tournament.id} />
              </div>
            )}
          </div>
        )}

        {eliminationMatches.length > 0 && (
          <div className="mt-6">
            <BracketBoard
            matches={eliminationMatches}
            editable
            quickResultEntry={quickResultEntry}
            tournamentId={tournament.id}
          />
          </div>
        )}
      </div>
    </div>
  );
}
