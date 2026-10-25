import { eliminationByeIndices } from "@/lib/bracket";
import type { DrawKind, DrawStep } from "@/lib/draw";

function groupLabel(index: number): string {
  return `Grupo ${String.fromCharCode(65 + index)}`;
}

function LastDrawn({ step, name, kind }: { step: DrawStep | undefined; name: string; kind: DrawKind }) {
  if (!step) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
        Nenhuma equipe sorteada ainda.
      </div>
    );
  }
  const destination = kind === "GROUPS" ? groupLabel(step.groupIndex ?? 0) : "posição na chave";
  return (
    <div className="rounded-xl border border-slate-900 bg-slate-900 p-6 text-center text-white">
      <p className="text-xs uppercase tracking-wide text-slate-300">Última equipe sorteada · Pote {step.pot}</p>
      <p className="mt-2 text-3xl font-semibold">{name}</p>
      {kind === "GROUPS" && <p className="mt-1 text-lg text-emerald-300">→ {destination}</p>}
    </div>
  );
}

/**
 * Read-only view of a draw as it's being revealed: only the first `revealed`
 * steps are shown, so the same component serves the organizer's ceremony
 * screen and the public live page (the full sequence never reaches the
 * browser beyond what has been revealed).
 */
export function DrawBoard({
  kind,
  steps,
  revealed,
  total,
  numGroups,
  teamNames,
}: {
  kind: DrawKind;
  steps: DrawStep[];
  revealed: number;
  total: number;
  numGroups: number;
  teamNames: Record<string, string>;
}) {
  const shown = steps.slice(0, revealed);
  const last = shown[shown.length - 1];
  const nameOf = (id: string) => teamNames[id] ?? "?";

  return (
    <div className="flex flex-col gap-6">
      <LastDrawn step={last} name={last ? nameOf(last.teamId) : ""} kind={kind} />

      <p className="text-sm text-slate-500">
        {revealed} de {total} equipes sorteadas
      </p>

      {kind === "GROUPS" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: numGroups }, (_, g) => {
            const inGroup = shown.filter((s) => s.groupIndex === g);
            return (
              <div key={g} className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">{groupLabel(g)}</h3>
                <ul className="flex flex-col gap-1">
                  {inGroup.map((s) => (
                    <li
                      key={s.teamId}
                      className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                        s.teamId === last?.teamId ? "bg-emerald-100 font-medium text-emerald-900" : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span>{nameOf(s.teamId)}</span>
                      <span className="text-xs text-slate-400">P{s.pot}</span>
                    </li>
                  ))}
                  {inGroup.length === 0 && <li className="text-sm text-slate-400">—</li>}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <KnockoutSlots shown={shown} total={total} lastTeamId={last?.teamId} nameOf={nameOf} />
      )}
    </div>
  );
}

function KnockoutSlots({
  shown,
  total,
  lastTeamId,
  nameOf,
}: {
  shown: DrawStep[];
  total: number;
  lastTeamId: string | undefined;
  nameOf: (id: string) => string;
}) {
  const byeSlots = eliminationByeIndices(total);
  const byeSet = new Set(byeSlots);
  const playingSlots = Array.from({ length: total }, (_, i) => i).filter((i) => !byeSet.has(i));
  const bySlot = new Map(shown.map((s) => [s.slot!, s]));

  const cell = (slot: number) => {
    const step = bySlot.get(slot);
    return (
      <span
        className={`rounded px-2 py-1 text-sm ${
          !step
            ? "bg-slate-50 text-slate-400"
            : step.teamId === lastTeamId
              ? "bg-emerald-100 font-medium text-emerald-900"
              : "bg-slate-100 text-slate-800"
        }`}
      >
        {step ? `${nameOf(step.teamId)} (P${step.pot})` : "?"}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Confrontos da 1ª rodada</h3>
        <ul className="flex flex-col gap-2">
          {Array.from({ length: playingSlots.length / 2 }, (_, p) => (
            <li key={p} className="flex items-center gap-2">
              <span className="w-6 text-xs text-slate-400">{p + 1}</span>
              {cell(playingSlots[p * 2])}
              <span className="text-xs text-slate-400">x</span>
              {cell(playingSlots[p * 2 + 1])}
            </li>
          ))}
        </ul>
      </div>
      {byeSlots.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Avançam direto para a 2ª rodada</h3>
          <ul className="flex flex-col gap-2">
            {byeSlots.map((slot) => (
              <li key={slot}>{cell(slot)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
