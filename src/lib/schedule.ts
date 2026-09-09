export interface ScheduleConfig {
  /** First day's date, e.g. "2026-04-10". */
  startDate: string;
  /** Time of the first match each day, e.g. "09:00". */
  startTime: string;
  /** How many matches to place per day before moving to the next day. */
  gamesPerDay: number;
  /** Minutes between the kickoff of consecutive matches on the same day. */
  intervalMinutes: number;
  /** Venues to cycle through in order, one per match. Empty = no venue assigned. */
  venueIds: string[];
}

export interface ScheduleAssignment {
  matchId: string;
  scheduledAt: Date;
  venueId: string | null;
}

/**
 * Pure scheduling: spreads `matchIds` (in the order given by the caller —
 * typically groups first, then elimination rounds in order) across days,
 * `gamesPerDay` at a time, `intervalMinutes` apart, cycling through
 * `venueIds` so different matches land on different courts/fields.
 */
export function distributeSchedule(matchIds: string[], config: ScheduleConfig): ScheduleAssignment[] {
  if (config.gamesPerDay < 1) {
    throw new Error("distributeSchedule: gamesPerDay must be at least 1");
  }
  if (config.intervalMinutes < 0) {
    throw new Error("distributeSchedule: intervalMinutes cannot be negative");
  }

  const [year, month, day] = config.startDate.split("-").map(Number);
  const [hour, minute] = config.startTime.split(":").map(Number);
  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) {
    throw new Error("distributeSchedule: invalid startDate/startTime");
  }
  const base = new Date(year, month - 1, day, hour, minute, 0, 0);

  return matchIds.map((matchId, i) => {
    const dayOffset = Math.floor(i / config.gamesPerDay);
    const slotInDay = i % config.gamesPerDay;

    const scheduledAt = new Date(base);
    scheduledAt.setDate(scheduledAt.getDate() + dayOffset);
    scheduledAt.setMinutes(scheduledAt.getMinutes() + slotInDay * config.intervalMinutes);

    const venueId = config.venueIds.length > 0 ? config.venueIds[i % config.venueIds.length] : null;

    return { matchId, scheduledAt, venueId };
  });
}
