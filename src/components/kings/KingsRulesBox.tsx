import { SECRET_CARDS, SECRET_CARD_EFFECTS, SECRET_CARD_LABELS, kingsPhases } from "@/lib/kings";
import { KingsPhaseGuide } from "@/components/kings/KingsTimeline";

/** "Como funciona" da Kings League, com os minutos e a pontuação deste campeonato. */
export function KingsRulesBox({
  firstHalf,
  secondHalf,
  points,
}: {
  firstHalf: number | null;
  secondHalf: number | null;
  points: { win: number; shootoutWin: number; shootoutLoss: number; loss: number };
}) {
  const phases = kingsPhases(firstHalf, secondHalf);
  return (
    <details className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">Como funciona a Kings League</summary>
      <div className="mt-3 flex flex-col gap-4 text-sm text-slate-600">
        <p>
          Futebol 7 (6 na linha + goleiro), substituições ilimitadas, tempo corrido: {phases.firstHalf} + {phases.secondHalf}{" "}
          minutos. Não existe empate: se o jogo terminar igual, a vitória sai nos shootouts (1x1 saindo do meio-campo, 5
          segundos para finalizar).
        </p>
        <KingsPhaseGuide phases={phases} />
        <div>
          <p className="font-medium text-slate-800">Cartas secretas (uma por time, sorteada antes do jogo)</p>
          <ul className="mt-1 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
            {SECRET_CARDS.map((c) => (
              <li key={c}>
                <strong className="text-slate-800">{SECRET_CARD_LABELS[c]}:</strong> {SECRET_CARD_EFFECTS[c]}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs">
          <strong className="text-slate-800">Pênalti do presidente:</strong> só o presidente presente pode acionar, fora das
          fases de escalonado, gol em dobro, dado e matchball; o adversário tem direito de resposta.{" "}
          <strong className="text-slate-800">Cartões:</strong> amarelo tira o jogador por 2 minutos; vermelho expulsa e o time
          fica com um a menos por 5 minutos.
        </p>
        <p className="text-xs">
          <strong className="text-slate-800">Classificação:</strong> vitória no tempo {points.win} pontos, vitória nos shootouts{" "}
          {points.shootoutWin}, derrota nos shootouts {points.shootoutLoss}, derrota {points.loss}.
        </p>
      </div>
    </details>
  );
}
