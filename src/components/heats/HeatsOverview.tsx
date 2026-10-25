import Link from "next/link";
import { advanceCount } from "@/lib/heats";
import type { HeatsOverview as HeatsOverviewData, PhaseView } from "@/lib/services/heats";

function phaseLabel(phase: PhaseView, totalPhases: number): string {
  if (phase.heats.length === 1) return "Final";
  if (phase.heats.length === 2 && phase.phase === totalPhases) return "Semifinais";
  return `Rodada ${phase.phase}`;
}

/**
 * Round-by-round view of a Just Dance heats tournament, shared by the
 * organizer's panel (heats link to the result form) and the public page.
 */
export function HeatsOverview({
  overview,
  teamNames,
  heatHref,
}: {
  overview: HeatsOverviewData;
  teamNames: Record<string, string>;
  heatHref?: (roundId: string) => string;
}) {
  const nameOf = (id: string) => teamNames[id] ?? "?";

  return (
    <div className="flex flex-col gap-8">
      {[...overview.phases].reverse().map((phase) => (
        <div key={phase.phase}>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">{phaseLabel(phase, overview.phases.length)}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {phase.heats.map((heat) => {
              const advances = phase.heats.length > 1 ? advanceCount(heat.entries.length) : 0;
              return (
                <div key={heat.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      {phase.heats.length === 1 ? "Bateria final" : `Bateria ${heat.number}`}
                    </p>
                    {heat.finished && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        Encerrada
                      </span>
                    )}
                  </div>
                  <ol className="flex flex-col gap-1">
                    {heat.entries.map((entry, index) => {
                      const qualified = heat.finished && index < advances;
                      return (
                        <li
                          key={entry.teamId}
                          className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                            qualified ? "bg-emerald-50 font-medium text-emerald-900" : "bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span>
                            {heat.finished && <span className="mr-2 text-xs text-slate-400">{entry.placement}º</span>}
                            {nameOf(entry.teamId)}
                          </span>
                          <span className="text-xs tabular-nums text-slate-500">
                            {entry.score !== null ? entry.score.toLocaleString("pt-BR") : ""}
                            {qualified && <span className="ml-2 text-emerald-700">avança</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  {heatHref && (
                    <Link href={heatHref(heat.id)} className="mt-3 inline-block text-xs text-slate-500 underline">
                      {heat.finished ? "Ver / corrigir resultado" : "Lançar resultado"}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
