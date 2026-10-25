import type { StandingRow } from "@/lib/lobbyScoring";

export function LobbyStandingsTable({
  title,
  standings,
  teamNames,
  roundNumbers,
  highlightTop,
}: {
  title: string;
  standings: StandingRow[];
  teamNames: Record<string, string>;
  /** Numbers of the quedas to show as columns (queda 1, 2, ...). */
  roundNumbers: number[];
  /** Rows to tint as "classificam" (e.g. who goes to the final). */
  highlightTop?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">{title}</div>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Equipe</th>
            <th className="px-3 py-2 text-right font-medium">Pts</th>
            <th className="px-3 py-2 text-right font-medium">Booyahs</th>
            <th className="px-3 py-2 text-right font-medium">Abates</th>
            {roundNumbers.map((n) => (
              <th key={n} className="px-3 py-2 text-right font-medium text-slate-400">
                Q{n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {standings.map((row, index) => (
            <tr key={row.teamId} className={highlightTop && index < highlightTop ? "bg-emerald-50" : undefined}>
              <td className="px-3 py-2 text-slate-500">{index + 1}</td>
              <td className="px-3 py-2 font-medium text-slate-900">{teamNames[row.teamId] ?? "?"}</td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.points}</td>
              <td className="px-3 py-2 text-right tabular-nums text-slate-600">{row.booyahs}</td>
              <td className="px-3 py-2 text-right tabular-nums text-slate-600">{row.kills}</td>
              {roundNumbers.map((_, i) => (
                <td key={i} className="px-3 py-2 text-right tabular-nums text-slate-400">
                  {row.perRound[i] ?? "–"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
