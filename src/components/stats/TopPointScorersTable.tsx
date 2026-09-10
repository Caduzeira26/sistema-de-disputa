import type { PointsStanding } from "@/lib/stats";

export function TopPointScorersTable({ scorers }: { scorers: PointsStanding[] }) {
  if (scorers.length === 0) {
    return <p className="text-sm text-slate-500">Nenhuma cesta registrada ainda.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">Jogador</th>
            <th className="px-4 py-2 font-medium">Equipe</th>
            <th className="px-4 py-2 text-center font-medium">Pontos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {scorers.map((s, i) => (
            <tr key={s.playerId}>
              <td className="px-4 py-2 text-slate-400">{i + 1}</td>
              <td className="px-4 py-2 font-medium text-slate-900">{s.playerName}</td>
              <td className="px-4 py-2 text-slate-600">{s.teamName}</td>
              <td className="px-4 py-2 text-center font-semibold text-slate-900">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
