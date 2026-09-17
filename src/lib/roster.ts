import type { Tournament } from "@prisma/client";

/**
 * Whether a team can still add or remove players on its roster after the
 * initial registration. Stays open for the whole tournament, including
 * while it's IN_PROGRESS, so teams can register late additions mid-event;
 * blocked only once the tournament is FINISHED. Before kickoff, a start
 * date still applies as a cutoff (covers an organizer who's running behind
 * it and hasn't flipped the status to IN_PROGRESS yet); no start date means
 * no date-based cutoff.
 */
export function isRosterCompletionWindowOpen(
  tournament: Pick<Tournament, "status" | "startDate">,
  now = new Date()
): boolean {
  if (tournament.status === "FINISHED") return false;
  if (tournament.status === "IN_PROGRESS") return true;
  if (!tournament.startDate) return true;

  return now < tournament.startDate;
}
