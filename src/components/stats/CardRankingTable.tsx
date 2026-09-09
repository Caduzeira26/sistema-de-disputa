import type { CardStanding } from "@/lib/stats";

export function CardRankingTable({ cards }: { cards: CardStanding[] }) {
  if (cards.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum cartão registrado ainda.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">Jogador</th>
            <th className="px-4 py-2 font-medium">Equipe</th>
            <th className="px-4 py-2 text-center font-medium">Amarelos</th>
            <th className="px-4 py-2 text-center font-medium">Vermelhos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {cards.map((c, i) => (
            <tr key={c.playerId}>
              <td className="px-4 py-2 text-slate-400">{i + 1}</td>
              <td className="px-4 py-2 font-medium text-slate-900">{c.playerName}</td>
              <td className="px-4 py-2 text-slate-600">{c.teamName}</td>
              <td className="px-4 py-2 text-center font-semibold text-amber-700">{c.yellow}</td>
              <td className="px-4 py-2 text-center font-semibold text-red-700">{c.red}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
