import Link from "next/link";
import { HEAT_SIZE } from "@/lib/heats";
import { loadHeatsOverview } from "@/lib/services/heats";
import { HeatsOverview } from "@/components/heats/HeatsOverview";
import { ResetBracketButton } from "@/components/admin/GenerateBracketButton";
import {
  CreateSingleHeatButton,
  FinishHeatsButton,
  NextRoundButton,
  ReopenHeatsButton,
} from "@/components/admin/HeatsControls";

/** The Just Dance heats counterpart of the bracket block on the organizer's tournament page. */
export async function HeatsAdminSection({
  tournamentId,
  status,
  hasDraw,
  teamNames,
}: {
  tournamentId: string;
  status: string;
  hasDraw: boolean;
  teamNames: Record<string, string>;
}) {
  const overview = await loadHeatsOverview(tournamentId);
  const dancerCount = Object.keys(teamNames).length;

  const hasRounds = overview.phases.length > 0;
  const latest = overview.phases[overview.phases.length - 1];
  const latestDone = latest ? latest.heats.every((h) => h.finished) : false;
  const latestIsFinal = latest ? latest.heats.length === 1 : false;
  const finished = status === "FINISHED";
  const needsDraw = !hasRounds && dancerCount > HEAT_SIZE;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Baterias</h2>
        {hasDraw && (
          <Link href={`/admin/torneios/${tournamentId}/sorteio`} className="text-sm text-slate-500 underline hover:text-slate-700">
            Ver o sorteio das baterias
          </Link>
        )}
      </div>

      {dancerCount < 2 && !hasRounds && (
        <p className="mt-3 text-sm text-slate-500">É preciso pelo menos 2 dançarinos aprovados para criar as baterias.</p>
      )}

      {dancerCount >= 2 && needsDraw && (
        <div className="mt-3 flex flex-col items-start gap-1">
          <Link
            href={`/admin/torneios/${tournamentId}/sorteio`}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Realizar o sorteio das baterias
          </Link>
          <p className="text-xs text-slate-500">
            Cada bateria tem até {HEAT_SIZE} dançarinos na mesma música. O sorteio distribui os {dancerCount} dançarinos
            nas baterias da 1ª rodada; os 2 melhores de cada uma avançam.
          </p>
        </div>
      )}

      {dancerCount >= 2 && !needsDraw && !hasRounds && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm text-slate-600">
            Com até {HEAT_SIZE} dançarinos, todos dançam numa única bateria e quem fizer mais pontos é o campeão.
          </p>
          <CreateSingleHeatButton tournamentId={tournamentId} />
        </div>
      )}

      {hasRounds && (
        <div className="mt-4">
          <HeatsOverview
            overview={overview}
            teamNames={teamNames}
            heatHref={(roundId) => `/admin/torneios/${tournamentId}/quedas/${roundId}`}
          />
        </div>
      )}

      {hasRounds && !finished && latestDone && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          {latestIsFinal ? (
            <>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Encerrar</h3>
              <FinishHeatsButton tournamentId={tournamentId} />
            </>
          ) : (
            <>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Próxima rodada</h3>
              <NextRoundButton tournamentId={tournamentId} />
            </>
          )}
        </div>
      )}

      {finished && (
        <div className="mt-4">
          <ReopenHeatsButton tournamentId={tournamentId} />
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
