import type { Tournament } from "@prisma/client";

/**
 * Whether a team can still add players to its roster after the initial
 * registration. Blocked once the tournament is underway or finished
 * (regardless of dates — covers an organizer who forgot to set a start
 * date, or one who's running behind it); when a start date IS set, also
 * blocked from one day before kickoff onward. No start date and a status
 * that isn't IN_PROGRESS/FINISHED means no date-based cutoff yet.
 */
export function isRosterCompletionWindowOpen(
  tournament: Pick<Tournament, "status" | "startDate">,
  now = new Date()
): boolean {
  if (tournament.status === "IN_PROGRESS" || tournament.status === "FINISHED") return false;
  if (!tournament.startDate) return true;

  const cutoff = new Date(tournament.startDate);
  cutoff.setDate(cutoff.getDate() - 1);
  return now < cutoff;
}
