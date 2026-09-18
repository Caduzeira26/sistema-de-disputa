import type { GoalkeeperStanding } from "@/lib/stats";

export function GoalkeeperRankingTable({ goalkeepers }: { goalkeepers: GoalkeeperStanding[] }) {
  if (goalkeepers.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum goleiro cadastrado ainda, ou nenhuma partida encerrada.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">Goleiro</th>
            <th className="px-4 py-2 font-medium">Equipe</th>
            <th className="px-4 py-2 text-center font-medium">Jogos</th>
            <th className="px-4 py-2 text-center font-medium">Sofridos</th>
            <th className="px-4 py-2 text-center font-medium">Média</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {goalkeepers.map((g, i) => (
            <tr key={g.playerId}>
              <td className="px-4 py-2 text-slate-400">{i + 1}</td>
              <td className="px-4 py-2 font-medium text-slate-900">{g.playerName}</td>
              <td className="px-4 py-2 text-slate-600">{g.teamName}</td>
              <td className="px-4 py-2 text-center text-slate-600">{g.matchesPlayed}</td>
              <td className="px-4 py-2 text-center text-slate-600">{g.goalsConceded}</td>
              <td className="px-4 py-2 text-center font-semibold text-slate-900">{g.average.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
