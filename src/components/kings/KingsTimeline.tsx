import { GOAL_KIND_LABELS, SECRET_CARD_LABELS, type GoalKind, type KingsPhases, type SecretCard } from "@/lib/kings";
import { removeKingsEventAction, removeKingsGoalAction } from "@/lib/actions/kings";
import { removeCardAction } from "@/lib/actions/sumula";

type Named = { id: string; name: string };

export interface KingsMatchData {
  goals: { id: string; minute: number; kind: GoalKind; value: number; player: Named; team: Named }[];
  cards: { id: string; minute: number | null; type: "YELLOW" | "RED"; player: Named; team: Named }[];
  kingsEvents: {
    id: string;
    type: "SECRET_CARD" | "PRESIDENT_PENALTY" | "DICE";
    minute: number | null;
    card: SecretCard | null;
    scored: boolean | null;
    goalsAwarded: number;
    diceResult: number | null;
    player: Named | null;
    team: Named | null;
  }[];
}

interface Item {
  key: string;
  minute: number;
  icon: string;
  text: string;
  detail?: string;
  remove?: { action: (formData: FormData) => Promise<void>; field: string; id: string };
}

function describeCard(e: KingsMatchData["kingsEvents"][number]): string {
  const name = SECRET_CARD_LABELS[e.card!];
  switch (e.card) {
    case "SUSPENSAO":
      return `${name}: ${e.player?.name ?? "jogador"} fora por 4 minutos`;
    case "JOGADOR_ESTRELA":
      return `${name}: ${e.player?.name ?? "jogador"}`;
    case "PENALTI":
    case "SHOOTOUT":
      return `${name}: ${e.player?.name ?? "batedor"} ${e.scored ? "marcou" : "perdeu"}`;
    case "PENALTI_INVERSO":
      return `${name}: o adversário ${e.scored ? "errou, gol para o time da carta" : "marcou (não vale)"}`;
    case "GOL_X2":
      return `${name}: gols valem 2 por 4 minutos`;
    default:
      return name;
  }
}

export function buildKingsTimeline(data: KingsMatchData, editable: boolean): Item[] {
  const items: Item[] = [];
  for (const g of data.goals) {
    items.push({
      key: `g-${g.id}`,
      minute: g.minute,
      icon: "⚽",
      text: `${g.player.name} (${g.team.name})`,
      detail: `${GOAL_KIND_LABELS[g.kind]}${g.value === 2 ? " · vale 2" : ""}`,
      remove: editable ? { action: removeKingsGoalAction, field: "goalId", id: g.id } : undefined,
    });
  }
  for (const c of data.cards) {
    items.push({
      key: `c-${c.id}`,
      minute: c.minute ?? 0,
      icon: c.type === "YELLOW" ? "🟨" : "🟥",
      text: `${c.player.name} (${c.team.name})`,
      detail: c.type === "YELLOW" ? "Amarelo: 2 minutos fora" : "Vermelho: expulso, time com um a menos por 5 minutos",
      remove: editable ? { action: removeCardAction, field: "cardId", id: c.id } : undefined,
    });
  }
  for (const e of data.kingsEvents) {
    const remove = editable ? { action: removeKingsEventAction, field: "eventId", id: e.id } : undefined;
    if (e.type === "DICE") {
      items.push({ key: `e-${e.id}`, minute: e.minute ?? 0, icon: "🎲", text: `Dado: ${e.diceResult}x${e.diceResult} (com goleiros)`, remove });
    } else if (e.type === "PRESIDENT_PENALTY") {
      items.push({
        key: `e-${e.id}`,
        minute: e.minute ?? 0,
        icon: "👑",
        text: `Pênalti do presidente (${e.team?.name ?? "?"})`,
        detail: e.scored ? "Gol" : "Perdeu",
        remove,
      });
    } else {
      items.push({
        key: `e-${e.id}`,
        minute: e.minute ?? 0,
        icon: "🃏",
        text: `Carta secreta (${e.team?.name ?? "?"})`,
        detail: describeCard(e),
        remove,
      });
    }
  }
  return items.sort((a, b) => a.minute - b.minute);
}

export function KingsTimeline({ data, editable }: { data: KingsMatchData; editable: boolean }) {
  const items = buildKingsTimeline(data, editable);
  if (items.length === 0) return <p className="text-sm text-slate-500">Nada registrado ainda.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {items.map((it) => (
        <li key={it.key} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <strong className="w-9 tabular-nums">{it.minute}&apos;</strong>
            <span aria-hidden>{it.icon}</span>
            <span className="text-slate-900">{it.text}</span>
            {it.detail && <span className="text-xs text-slate-500">{it.detail}</span>}
          </span>
          {it.remove && (
            <form action={it.remove.action}>
              <input type="hidden" name={it.remove.field} value={it.remove.id} />
              <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                Remover
              </button>
            </form>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Guia das fases com os minutos deste campeonato. */
export function KingsPhaseGuide({ phases }: { phases: KingsPhases }) {
  const rows: [string, string][] = [
    [`0'–${phases.staggeredEnd}'`, "Escalonado: começa 1x1 com goleiros e entra um jogador por time a cada minuto, até 7x7."],
    [`${phases.staggeredEnd}'–${phases.doubleStart}'`, "Cartas secretas e pênalti do presidente liberados."],
    [`${phases.doubleStart}'–${phases.halfTime}'`, "Gols em dobro: todo gol vale 2 até o intervalo."],
    [`${phases.halfTime}'–${phases.diceEnd}'`, "Dado: 1x1, 2x2 ou 3x3 (com goleiros)."],
    [`${phases.diceEnd}'–${phases.end}'`, "Cartas secretas e pênalti do presidente voltam a valer."],
    [`${phases.end}'`, "Empate vai para os shootouts. Se não, modo matchball: se quem vence marcar, acaba; se o outro empatar, o próximo gol decide."],
  ];
  return (
    <ol className="grid grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-2">
      {rows.map(([when, what]) => (
        <li key={when} className="flex gap-2">
          <strong className="w-16 shrink-0 tabular-nums text-slate-900">{when}</strong>
          <span>{what}</span>
        </li>
      ))}
    </ol>
  );
}
