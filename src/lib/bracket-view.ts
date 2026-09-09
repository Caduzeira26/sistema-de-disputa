import type { DisplayMatch } from "@/components/bracket/types";

interface RawMatch {
  id: string;
  bracket: string;
  round: number;
  position: number;
  groupId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  isReset: boolean;
  scheduledAt?: Date | null;
  venue?: { name: string } | null;
}

interface RawTeam {
  id: string;
  name: string;
  logoUrl: string | null;
}

export function toDisplayMatches(matches: RawMatch[], teams: RawTeam[]): DisplayMatch[] {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  return matches.map((m) => ({
    id: m.id,
    bracket: m.bracket as DisplayMatch["bracket"],
    round: m.round,
    position: m.position,
    groupId: m.groupId,
    homeTeam: m.homeTeamId ? (teamById.get(m.homeTeamId) ?? null) : null,
    awayTeam: m.awayTeamId ? (teamById.get(m.awayTeamId) ?? null) : null,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status as DisplayMatch["status"],
    isReset: m.isReset,
    scheduledAt: m.scheduledAt ?? null,
    venueName: m.venue?.name ?? null,
  }));
}
