/** Small logo shown next to the tournament name in page headers. */
export function TournamentHeaderLogo({ logoUrl, tournamentName }: { logoUrl: string | null; tournamentName: string }) {
  if (!logoUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={`Logo de ${tournamentName}`}
      className="h-12 w-12 shrink-0 rounded-md border border-slate-200 bg-white object-contain p-1"
    />
  );
}

/**
 * Faint full-sheet watermark. The nearest ancestor must have `relative` (or
 * another positioning context) and `overflow-hidden` for this to stay
 * clipped to that page's content area instead of bleeding past it.
 */
export function TournamentWatermark({ logoUrl }: { logoUrl: string | null }) {
  if (!logoUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt=""
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 m-auto h-auto max-h-[70%] w-auto max-w-[70%] object-contain opacity-[0.07] grayscale"
    />
  );
}
