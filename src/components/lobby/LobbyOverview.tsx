import Link from "next/link";
import type { LobbyOverview as LobbyOverviewData, LobbySection } from "@/lib/services/lobby";
import { LobbyStandingsTable } from "./LobbyStandingsTable";

function RoundChips({ section, roundHref }: { section: LobbySection; roundHref?: (roundId: string) => string }) {
  if (section.rounds.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {section.rounds.map((round) => {
        const className = `rounded-full border px-3 py-1 text-xs font-medium ${
          round.finished
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-slate-200 bg-white text-slate-600"
        }`;
        const label = `Queda ${round.number}${round.finished ? " ✓" : ""}`;
        return roundHref ? (
          <Link key={round.id} href={roundHref(round.id)} className={`${className} hover:bg-slate-50`}>
            {label}
          </Link>
        ) : (
          <span key={round.id} className={className}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Standings and queda list for a Free Fire tournament, used by both the
 * organizer's panel (with links to enter results) and the public page.
 */
export function LobbyOverview({
  overview,
  teamNames,
  roundHref,
  finalistsPerGroup,
}: {
  overview: LobbyOverviewData;
  teamNames: Record<string, string>;
  roundHref?: (roundId: string) => string;
  finalistsPerGroup?: number;
}) {
  const sections: { key: string; heading: string; section: LobbySection; highlight?: number }[] = [];
  if (overview.final) {
    sections.push({ key: "final", heading: "Grande final", section: overview.final, highlight: 3 });
  }
  for (const section of overview.qualifying) {
    sections.push({
      key: section.group?.id ?? "qualifying",
      heading: section.group ? `Fase classificatória · ${section.group.name}` : "Fase classificatória",
      section,
      highlight: overview.final ? undefined : finalistsPerGroup,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {sections.map(({ key, heading, section, highlight }) => (
        <div key={key} className="flex flex-col gap-3">
          <LobbyStandingsTable
            title={heading}
            standings={section.standings}
            teamNames={teamNames}
            roundNumbers={section.rounds.map((r) => r.number)}
            highlightTop={highlight}
          />
          <RoundChips section={section} roundHref={roundHref} />
        </div>
      ))}
    </div>
  );
}
