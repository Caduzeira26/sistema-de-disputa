import type { TeamStanding } from "@/lib/bracket";

export function StandingsTable({
  title,
  standings,
  teamNames,
  advanceCount,
}: {
  title: string;
  standings: TeamStanding[];
  teamNames: Record<string, string>;
  advanceCount?: number;
}) {
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-slate-700">{title}</h4>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-2 py-1 text-left font-medium">#</th>
              <th className="px-2 py-1 text-left font-medium">Equipe</th>
              <th className="px-2 py-1 text-center font-medium">PJ</th>
              <th className="px-2 py-1 text-center font-medium">V</th>
              <th className="px-2 py-1 text-center font-medium">E</th>
              <th className="px-2 py-1 text-center font-medium">D</th>
              <th className="px-2 py-1 text-center font-medium">GP</th>
              <th className="px-2 py-1 text-center font-medium">GC</th>
              <th className="px-2 py-1 text-center font-medium">SG</th>
              <th className="px-2 py-1 text-center font-medium">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {standings.map((s, i) => (
              <tr key={s.teamId} className={advanceCount && i < advanceCount ? "bg-emerald-50" : undefined}>
                <td className="px-2 py-1 text-slate-400">{i + 1}</td>
                <td className="px-2 py-1 font-medium text-slate-900">{teamNames[s.teamId] ?? s.teamId}</td>
                <td className="px-2 py-1 text-center">{s.played}</td>
                <td className="px-2 py-1 text-center">{s.wins}</td>
                <td className="px-2 py-1 text-center">{s.draws}</td>
                <td className="px-2 py-1 text-center">{s.losses}</td>
                <td className="px-2 py-1 text-center">{s.goalsFor}</td>
                <td className="px-2 py-1 text-center">{s.goalsAgainst}</td>
                <td className="px-2 py-1 text-center">{s.goalDifference}</td>
                <td className="px-2 py-1 text-center font-semibold">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
