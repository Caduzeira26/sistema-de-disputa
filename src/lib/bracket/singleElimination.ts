import type { TeamInput, GeneratedBracket, GeneratedMatch, Entrant } from "./types";
import { nextPowerOfTwo, prevPowerOfTwo } from "./seeding";
import { createIdGenerator } from "./ids";
import { wireEntrant } from "./pairing";

export interface EliminationTree {
  matches: GeneratedMatch[];
  finalMatchId: string;
  /** Losers dropping out after each winners-bracket round, index 0 = round 1. */
  loserEntrantsByRound: Entrant[][];
}

/** A slot mid-construction: either a raw team or the (not-yet-played) winner
 *  of an earlier match, tagged with its topological round (0 for a raw team,
 *  otherwise 1 + the deepest round among its own inputs) so newly created
 *  matches can compute their own round consistently. */
interface Node {
  entrant: Entrant;
  round: number;
}

interface BuildContext {
  matches: GeneratedMatch[];
  nextId: () => string;
  /** Losers recorded per round, 0-indexed by (round - 1); padded with empty
   *  arrays for any round that (so far) produced no loser. */
  losersByRound: Entrant[][];
}

function recordLoser(ctx: BuildContext, matchId: string, round: number): void {
  const idx = round - 1;
  while (ctx.losersByRound.length <= idx) ctx.losersByRound.push([]);
  ctx.losersByRound[idx].push({ type: "TBD", matchId, via: "LOSER" });
}

function makeMatch(ctx: BuildContext, home: Node, away: Node): Node {
  const id = ctx.nextId();
  const round = 1 + Math.max(home.round, away.round);
  ctx.matches.push({
    id,
    bracket: "WINNERS",
    round,
    position: 0, // assigned once the full tree is built, see assignPositions
    groupId: null,
    homeTeamId: home.entrant.type === "TEAM" ? home.entrant.teamId : null,
    awayTeamId: away.entrant.type === "TEAM" ? away.entrant.teamId : null,
    autoWinnerTeamId: null,
    winnerNextMatchId: null,
    winnerNextSlot: null,
    loserNextMatchId: null,
    loserNextSlot: null,
    isReset: false,
  });
  wireEntrant(ctx.matches, home.entrant, id, "HOME");
  wireEntrant(ctx.matches, away.entrant, id, "AWAY");
  recordLoser(ctx, id, round);
  return { entrant: { type: "TBD", matchId: id, via: "WINNER" }, round };
}

/**
 * Reduces `nodes` to a single champion node by repeatedly pairing from both
 * ends inward ("outside-in"): at each pass, `byes` entrants — as many as
 * needed to bring the count to the nearest power of two, per the standard
 * NJ=C-1 formula's bye count — are left untouched in the middle, carrying
 * over to the next pass, while the rest pair off starting from the two ends
 * and working toward the middle.
 */
function reduceOutsideIn(nodes: Node[], ctx: BuildContext): Node {
  let current = nodes;
  while (current.length > 1) {
    const n = current.length;
    const prevP = prevPowerOfTwo(n);
    const nextP = nextPowerOfTwo(n);
    const byes = Math.min(n - prevP, nextP - n);
    const matchCount = (n - byes) / 2;

    const pairedIndex = new Set<number>();
    const pairs: Array<[number, number]> = [];
    let lo = 0;
    let hi = n - 1;
    let useLo = true;
    while (pairs.length < matchCount) {
      if (useLo) {
        pairs.push([lo, lo + 1]);
        pairedIndex.add(lo);
        pairedIndex.add(lo + 1);
        lo += 2;
      } else {
        pairs.push([hi - 1, hi]);
        pairedIndex.add(hi - 1);
        pairedIndex.add(hi);
        hi -= 2;
      }
      useLo = !useLo;
    }

    const winnerAtIndex = new Map<number, Node>();
    for (const [a, b] of pairs) {
      winnerAtIndex.set(a, makeMatch(ctx, current[a], current[b]));
    }

    const next: Node[] = [];
    for (let i = 0; i < n; i++) {
      const winner = winnerAtIndex.get(i);
      if (winner) next.push(winner);
      else if (!pairedIndex.has(i)) next.push(current[i]);
    }
    current = next;
  }
  return current[0];
}

/**
 * Builds a winners-bracket tree for `entrants` (already in seed/draw order),
 * using the minimal-byes convention of the classic paper single-elimination
 * templates: only just enough teams sit out the first round — `byes =
 * min(n - prevPowerOfTwo(n), nextPowerOfTwo(n) - n)` — for everyone else to
 * pair up immediately, rather than padding the whole bracket to the next
 * power of two and giving the top half of seeds a round-1 bye.
 *
 * When 3 or more byes are needed, a single flat round can't place them
 * sensibly (there's no single "front/back" split that keeps the bracket
 * balanced), so the entrants are instead split into two halves — sizes
 * ceil(n/2) and floor(n/2), keeping list order — each built the same way
 * recursively, and their two champions meet at the top.
 */
function buildGroup(entrants: Node[], ctx: BuildContext): Node {
  const n = entrants.length;
  if (n === 1) return entrants[0];
  if (n === 2) return makeMatch(ctx, entrants[0], entrants[1]);

  const prevP = prevPowerOfTwo(n);
  const nextP = nextPowerOfTwo(n);
  const byes = Math.min(n - prevP, nextP - n);

  if (byes >= 3) {
    const leftSize = Math.ceil(n / 2);
    const left = buildGroup(entrants.slice(0, leftSize), ctx);
    const right = buildGroup(entrants.slice(leftSize), ctx);
    return makeMatch(ctx, left, right);
  }

  const frontByes = Math.ceil(byes / 2);
  const backByes = byes - frontByes;
  const delayedFront = entrants.slice(0, frontByes);
  const delayedBack = backByes > 0 ? entrants.slice(n - backByes) : [];
  const middle = entrants.slice(frontByes, n - backByes);

  const pairWinners: Node[] = [];
  for (let i = 0; i < middle.length; i += 2) {
    pairWinners.push(makeMatch(ctx, middle[i], middle[i + 1]));
  }

  const combined = [...delayedFront, ...pairWinners, ...delayedBack];
  return reduceOutsideIn(combined, ctx);
}

/** Assigns each match a display position, unique within its round (creation order). */
function assignPositions(matches: GeneratedMatch[]): void {
  const countByRound = new Map<number, number>();
  for (const m of matches) {
    const position = countByRound.get(m.round) ?? 0;
    m.position = position;
    countByRound.set(m.round, position + 1);
  }
}

export function buildEliminationTree(teams: TeamInput[], idPrefix: string): EliminationTree {
  if (teams.length < 2) {
    throw new Error("buildEliminationTree: need at least 2 teams");
  }

  const sorted = [...teams].sort((a, b) => a.seed - b.seed);
  const ctx: BuildContext = { matches: [], nextId: createIdGenerator(idPrefix), losersByRound: [] };
  const leaves: Node[] = sorted.map((t) => ({ entrant: { type: "TEAM", teamId: t.id }, round: 0 }));

  const champion = buildGroup(leaves, ctx);
  assignPositions(ctx.matches);

  // `teams.length >= 2` guarantees at least one match was played, so the
  // champion is always a TBD (the winner of that final match).
  const finalMatchId = champion.entrant.type === "TBD" ? champion.entrant.matchId : ctx.matches[ctx.matches.length - 1].id;

  return { matches: ctx.matches, finalMatchId, loserEntrantsByRound: ctx.losersByRound };
}

export function generateSingleElimination(teams: TeamInput[]): GeneratedBracket {
  const { matches, finalMatchId } = buildEliminationTree(teams, "WB");
  return { matches, finalMatchId };
}
