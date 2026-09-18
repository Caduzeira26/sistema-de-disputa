import { layoutBracketTree } from "@/lib/bracket/treeLayout";
import type { DisplayMatch } from "./types";
import { MatchCard } from "./MatchCard";

const BOX_WIDTH = 224;
const COLUMN_GAP = 56;
const COLUMN_WIDTH = BOX_WIDTH + COLUMN_GAP;
const ROW_HEIGHT = 120;
const BOX_HEIGHT_ESTIMATE = 92; // used only to center connector lines on a box

/**
 * Draws one bracket tree — a set of matches connected by lines from each
 * match to the one its winner advances to, laid out the way a printed
 * bracket is: each match centered between its two feeders. Reuses
 * `MatchCard` for the boxes themselves; only the positions and the SVG
 * connector lines are new.
 */
export function BracketTree({
  matches,
  editable = false,
  quickResultEntry = true,
  tournamentId,
  publicSlug,
}: {
  matches: DisplayMatch[];
  editable?: boolean;
  quickResultEntry?: boolean;
  tournamentId?: string;
  publicSlug?: string;
}) {
  if (matches.length === 0) return null;

  const layout = layoutBracketTree(
    matches.map((m) => ({ id: m.id, round: m.round, winnerNextMatchId: m.winnerNextMatchId, winnerNextSlot: m.winnerNextSlot }))
  );
  const byId = new Map(matches.map((m) => [m.id, m]));

  const minRound = Math.min(...matches.map((m) => m.round));
  const maxY = Math.max(...[...layout.values()].map((l) => l.y));
  const width = (Math.max(...matches.map((m) => m.round)) - minRound + 1) * COLUMN_WIDTH;
  const height = (maxY + 1) * ROW_HEIGHT + BOX_HEIGHT_ESTIMATE;

  const xOf = (round: number) => (round - minRound) * COLUMN_WIDTH;
  const yOf = (y: number) => y * ROW_HEIGHT;

  const connectors: string[] = [];
  for (const m of matches) {
    if (!m.winnerNextMatchId) continue;
    const target = byId.get(m.winnerNextMatchId);
    const from = layout.get(m.id);
    const to = layout.get(m.winnerNextMatchId);
    if (!target || !from || !to) continue;

    const x1 = xOf(from.round) + BOX_WIDTH;
    const y1 = yOf(from.y) + BOX_HEIGHT_ESTIMATE / 2;
    const x2 = xOf(to.round);
    const slotOffset = m.winnerNextSlot === "AWAY" ? BOX_HEIGHT_ESTIMATE * 0.28 : -BOX_HEIGHT_ESTIMATE * 0.28;
    const y2 = yOf(to.y) + BOX_HEIGHT_ESTIMATE / 2 + slotOffset;
    const midX = x1 + COLUMN_GAP / 2;

    connectors.push(`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`);
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="pointer-events-none absolute inset-0">
          {connectors.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="var(--color-slate-300, #cbd5e1)" strokeWidth={2} />
          ))}
        </svg>
        {matches.map((m) => {
          const pos = layout.get(m.id);
          if (!pos) return null;
          return (
            <div key={m.id} className="absolute" style={{ left: xOf(pos.round), top: yOf(pos.y) }}>
              <MatchCard
                match={m}
                editable={editable}
                quickResultEntry={quickResultEntry}
                tournamentId={tournamentId}
                publicSlug={publicSlug}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
