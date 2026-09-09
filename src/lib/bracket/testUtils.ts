import type { GeneratedMatch } from "./types";
import { applyMatchResult, type MatchRecord } from "./advance";

export interface SimResult {
  championTeamId: string | null;
  lossCount: Map<string, number>;
  playedRealMatches: number;
  finalMatches: GeneratedMatch[];
}

type MutableMatch = GeneratedMatch & { _played?: boolean };

/**
 * Plays out a fully generated bracket using `decideWinner` to resolve each
 * playable match, applying the same advancement logic (`applyMatchResult`)
 * the app uses at runtime. Lets tests assert whole-tournament invariants
 * (exactly one champion, every eliminated team lost exactly twice in a
 * double-elimination bracket, etc.) instead of just checking the generated
 * shape in isolation.
 */
export function simulateBracket(
  generated: GeneratedMatch[],
  decideWinner: (homeTeamId: string, awayTeamId: string) => string
): SimResult {
  const byId = new Map<string, MutableMatch>();
  for (const m of generated) byId.set(m.id, { ...m });

  const lossCount = new Map<string, number>();
  const bump = (teamId: string) => lossCount.set(teamId, (lossCount.get(teamId) ?? 0) + 1);

  let championTeamId: string | null = null;
  let playedRealMatches = 0;
  let progressed = true;
  let guard = 0;

  while (progressed) {
    if (++guard > 10_000) throw new Error("simulateBracket: exceeded iteration guard, likely an infinite loop");
    progressed = false;

    for (const m of byId.values()) {
      if (m.autoWinnerTeamId) continue; // resolved at generation time
      if (m._played) continue;
      if (m.bracket === "GRAND_FINAL" && m.isReset && (!m.homeTeamId || !m.awayTeamId)) continue; // not activated
      if (!m.homeTeamId || !m.awayTeamId) continue; // still waiting on a previous result

      const winnerTeamId = decideWinner(m.homeTeamId, m.awayTeamId);
      const homeScore = winnerTeamId === m.homeTeamId ? 1 : 0;
      const awayScore = winnerTeamId === m.awayTeamId ? 1 : 0;

      const record: MatchRecord = {
        id: m.id,
        bracket: m.bracket,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        winnerNextMatchId: m.winnerNextMatchId,
        winnerNextSlot: m.winnerNextSlot,
        loserNextMatchId: m.loserNextMatchId,
        loserNextSlot: m.loserNextSlot,
        isReset: m.isReset,
      };
      const outcome = applyMatchResult(record, homeScore, awayScore, [...byId.values()]);

      m._played = true;
      playedRealMatches += 1;
      bump(outcome.loserTeamId);

      for (const update of outcome.slotUpdates) {
        const target = byId.get(update.matchId);
        if (!target) throw new Error(`simulateBracket: target match ${update.matchId} not found`);
        if (update.slot === "HOME") target.homeTeamId = update.teamId;
        else target.awayTeamId = update.teamId;
      }
      if (outcome.championTeamId) championTeamId = outcome.championTeamId;

      progressed = true;
    }
  }

  return { championTeamId, lossCount, playedRealMatches, finalMatches: [...byId.values()] };
}
