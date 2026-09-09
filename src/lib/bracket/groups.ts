import type { TeamInput, GeneratedMatch } from "./types";
import { createIdGenerator } from "./ids";

export function splitIntoGroups(teams: TeamInput[], numGroups: number): TeamInput[][] {
  if (numGroups < 1) throw new Error("splitIntoGroups: numGroups must be >= 1");
  const sorted = [...teams].sort((a, b) => a.seed - b.seed);
  const groups: TeamInput[][] = Array.from({ length: numGroups }, () => []);

  // Snake seeding (1,2,3..k, k,k-1..1, 1,2..) so group strength stays balanced.
  let groupIndex = 0;
  let direction = 1;
  for (const team of sorted) {
    groups[groupIndex].push(team);
    const next = groupIndex + direction;
    if (next < 0 || next >= numGroups) direction *= -1;
    else groupIndex = next;
  }
  return groups;
}

export interface RoundRobinFixture {
  round: number;
  home: string;
  away: string;
}

/** Circle-method round robin: every team plays every other team once. */
export function generateRoundRobin(teamIds: string[]): RoundRobinFixture[] {
  if (teamIds.length < 2) return [];

  const arr: (string | null)[] = [...teamIds];
  if (arr.length % 2 === 1) arr.push(null); // bye slot, sits out each round
  const n = arr.length;
  const rounds = n - 1;
  const half = n / 2;

  let current = arr;
  const fixtures: RoundRobinFixture[] = [];
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      if (home !== null && away !== null) {
        fixtures.push({ round: r + 1, home, away });
      }
    }
    const next = new Array<string | null>(n);
    next[0] = current[0];
    next[1] = current[n - 1];
    for (let i = 2; i < n; i++) next[i] = current[i - 1];
    current = next;
  }
  return fixtures;
}

export interface GeneratedGroup {
  id: string;
  teamIds: string[];
}

export interface GroupStageResult {
  groups: GeneratedGroup[];
  matches: GeneratedMatch[];
}

export function generateGroupStage(teams: TeamInput[], numGroups: number): GroupStageResult {
  const grouped = splitIntoGroups(teams, numGroups);
  const nextGroupId = createIdGenerator("GRP");
  const nextMatchId = createIdGenerator("GROUP");

  const groups = grouped.map((ts) => ({ id: nextGroupId(), teamIds: ts.map((t) => t.id) }));
  const matches: GeneratedMatch[] = [];

  for (const group of groups) {
    const fixtures = generateRoundRobin(group.teamIds);
    fixtures.forEach((f, index) => {
      matches.push({
        id: nextMatchId(),
        bracket: "GROUP",
        round: f.round,
        position: index,
        groupId: group.id,
        homeTeamId: f.home,
        awayTeamId: f.away,
        autoWinnerTeamId: null,
        winnerNextMatchId: null,
        winnerNextSlot: null,
        loserNextMatchId: null,
        loserNextSlot: null,
        isReset: false,
      });
    });
  }

  return { groups, matches };
}
