import Link from "next/link";
import { LOBBY_SIZE } from "@/lib/lobbyScoring";
import { loadLobbyOverview } from "@/lib/services/lobby";
import { LobbyOverview } from "@/components/lobby/LobbyOverview";
import { ResetBracketButton } from "@/components/admin/GenerateBracketButton";
import {
  CreateRoundsForm,
  FinishTournamentButton,
  GenerateFinalForm,
  ReopenTournamentButton,
} from "@/components/admin/LobbyControls";

/** The Free Fire counterpart of the bracket block on the organizer's tournament page. */
export async function LobbyAdminSection({
  tournamentId,
  status,
  hasDraw,
  groupsCount,
  teamNames,
}: {
  tournamentId: string;
  status: string;
  hasDraw: boolean;
  groupsCount: number;
  teamNames: Record<string, string>;
}) {
  const overview = await loadLobbyOverview(tournamentId);
  const approvedCount = Object.keys(teamNames).length;

  const finalExists = overview.final !== null;
  const hasRounds = overview.qualifying.some((s) => s.rounds.length > 0) || finalExists;
  const finished = status === "FINISHED";
  const needsDraw = groupsCount === 0 && approvedCount > LOBBY_SIZE;

  const qualifyingDone = overview.qualifying.every((s) => s.rounds.length > 0 && s.rounds.every((r) => r.finished));
  const decidingDone = finalExists
    ? overview.final!.rounds.every((r) => r.finished)
    : overview.qualifying.length === 1 && qualifyingDone;
  const defaultTop = groupsCount > 0 ? Math.max(1, Math.floor(LOBBY_SIZE / groupsCount)) : Math.max(2, Math.floor(approvedCount / 2));

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Quedas</h2>
        {hasDraw && (
          <Link href={`/admin/torneios/${tournamentId}/sorteio`} className="text-sm text-slate-500 underline hover:text-slate-700">
            Ver o sorteio dos grupos
          </Link>
        )}
      </div>

      {approvedCount < 2 && (
        <p className="mt-3 text-sm text-slate-500">É preciso pelo menos 2 equipes aprovadas para criar as quedas.</p>
      )}

      {approvedCount >= 2 && needsDraw && (
        <div className="mt-3 flex flex-col items-start gap-1">
          <Link
            href={`/admin/torneios/${tournamentId}/sorteio`}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Realizar o sorteio dos grupos
          </Link>
          <p className="text-xs text-slate-500">
            Uma sala comporta {LOBBY_SIZE} equipes. Com {approvedCount} equipes, o sorteio divide todo mundo em grupos, e
            cada grupo joga as suas quedas.
          </p>
        </div>
      )}

      {approvedCount >= 2 && !needsDraw && !hasRounds && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm text-slate-600">
            Cada queda é uma partida com todas as equipes juntas: você lança a colocação e os abates de cada uma e o
            sistema soma os pontos.
          </p>
          <CreateRoundsForm tournamentId={tournamentId} label="Criar quedas" />
        </div>
      )}

      {hasRounds && (
        <div className="mt-4">
          <LobbyOverview
            overview={overview}
            teamNames={teamNames}
            roundHref={(roundId) => `/admin/torneios/${tournamentId}/quedas/${roundId}`}
            finalistsPerGroup={qualifyingDone && !finalExists ? defaultTop : undefined}
          />
        </div>
      )}

      {hasRounds && !finished && (
        <div className="mt-6 flex flex-col gap-5 rounded-lg border border-slate-200 bg-white p-4">
          {!finalExists && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Adicionar mais quedas</h3>
              <CreateRoundsForm tournamentId={tournamentId} label="Adicionar quedas" />
            </div>
          )}

          {!finalExists && qualifyingDone && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-700">Grande final</h3>
              <p className="mb-2 text-xs text-slate-500">
                Os melhores de cada grupo disputam uma final com a tabela zerada (no máximo {LOBBY_SIZE} equipes).
              </p>
              <GenerateFinalForm tournamentId={tournamentId} defaultTop={defaultTop} />
            </div>
          )}

          {decidingDone && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Encerrar</h3>
              <FinishTournamentButton tournamentId={tournamentId} />
            </div>
          )}
        </div>
      )}

      {finished && (
        <div className="mt-4">
          <ReopenTournamentButton tournamentId={tournamentId} />
        </div>
      )}

      {(hasRounds || hasDraw) && (
        <div className="mt-4">
          <ResetBracketButton tournamentId={tournamentId} />
        </div>
      )}
    </div>
  );
}
