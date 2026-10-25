import { drawGroups } from "./groups";
import { drawKnockout } from "./knockout";
import type { Rng } from "./rng";
import type { DrawKind, DrawStep, DrawTeam } from "./types";

export * from "./types";
export * from "./rng";
export * from "./pots";
export * from "./qualifiers";
export { drawGroups, drawKnockout };

export function buildDrawSteps(params: { kind: DrawKind; teams: DrawTeam[]; numGroups?: number; rng: Rng }): DrawStep[] {
  return params.kind === "GROUPS"
    ? drawGroups(params.teams, params.numGroups ?? 1, params.rng)
    : drawKnockout(params.teams, params.rng);
}

/** Resolves a finished draw into what the bracket generators consume. */
export function resolveDraw(
  kind: DrawKind,
  steps: DrawStep[],
  numGroups: number
): { orderedTeamIds: string[]; groups: string[][] } {
  if (kind === "GROUPS") {
    const groups: string[][] = Array.from({ length: numGroups }, () => []);
    for (const step of steps) groups[step.groupIndex!].push(step.teamId);
    return { orderedTeamIds: groups.flat(), groups };
  }
  const ordered = [...steps].sort((a, b) => a.slot! - b.slot!).map((s) => s.teamId);
  return { orderedTeamIds: ordered, groups: [] };
}
