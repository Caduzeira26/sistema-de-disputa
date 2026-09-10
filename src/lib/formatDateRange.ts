function fmt(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** Formats a tournament's start/end dates for display. Either may be absent. */
export function formatTournamentDateRange(startDate: Date | null, endDate: Date | null): string | null {
  if (startDate && endDate) {
    return `${fmt(startDate)} a ${fmt(endDate)}`;
  }
  if (startDate) return `A partir de ${fmt(startDate)}`;
  if (endDate) return `Até ${fmt(endDate)}`;
  return null;
}
