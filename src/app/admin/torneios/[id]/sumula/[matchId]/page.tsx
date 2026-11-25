import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TournamentHeaderLogo } from "@/components/TournamentBranding";
import { PrintButton } from "@/components/PrintButton";
import { assignGameNumbers } from "@/lib/bracket/gameOrder";
import { SECRET_CARDS, SECRET_CARD_LABELS, kingsPhases } from "@/lib/kings";

/**
 * Súmula da Kings League em branco, para o mesário preencher à mão na beira do campo
 * e depois passar para o sistema.
 */
export default async function PrintKingsSumulaPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { matchId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      venue: true,
      group: true,
      homeTeam: { include: { players: { where: { active: true }, orderBy: [{ shirtNumber: "asc" }, { name: "asc" }] } } },
      awayTeam: { include: { players: { where: { active: true }, orderBy: [{ shirtNumber: "asc" }, { name: "asc" }] } } },
    },
  });
  if (!match || match.tournament.organizerId !== session.user.id) notFound();
  if (match.tournament.sportType !== "KINGS_LEAGUE") notFound();

  const siblings = await prisma.match.findMany({
    where: { tournamentId: match.tournamentId },
    select: { id: true, bracket: true, round: true, position: true, status: true, homeTeamId: true, awayTeamId: true, winnerNextMatchId: true, loserNextMatchId: true },
  });
  const gameNumber = assignGameNumbers(siblings).get(match.id) ?? null;
  const p = kingsPhases(match.tournament.kingsFirstHalfMinutes, match.tournament.kingsSecondHalfMinutes);
  const teams = [match.homeTeam, match.awayTeam];
  const when = match.scheduledAt
    ? `${match.scheduledAt.toLocaleDateString("pt-BR")} às ${match.scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : "____/____/______  às ____:____";

  const cell = "border border-slate-400 px-1.5 py-1";
  const blankRows = (n: number) => Array.from({ length: n }, (_, i) => i);

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 py-6 text-[11px] leading-tight text-slate-900 print:max-w-none print:p-0">
      <style>{`@page { size: A4 portrait; margin: 10mm; }`}</style>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/admin/torneios/${match.tournamentId}/partidas/${match.id}`} className="text-sm text-slate-500 underline">
          Voltar à súmula
        </Link>
        <PrintButton label="Imprimir súmula" />
      </div>

      <header className="flex items-center gap-3 border-b-2 border-slate-900 pb-2">
        <TournamentHeaderLogo logoUrl={match.tournament.logoUrl} tournamentName={match.tournament.name} />
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide">Súmula · Kings League</p>
          <h1 className="text-base font-bold">{match.tournament.name}</h1>
          <p>
            {gameNumber !== null ? `Jogo ${gameNumber} · ` : ""}
            {match.group ? `${match.group.name} · ` : match.bracket !== "GROUP" ? "Playoffs · " : ""}
            {when} · Local: {match.venue?.name ?? "________________"}
          </p>
        </div>
      </header>

      <section className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
        <p className="text-sm font-bold">{match.homeTeam?.name ?? "Equipe A"}</p>
        <table className="border-collapse">
          <thead>
            <tr>
              <th className={cell}></th>
              <th className={cell}>1º tempo</th>
              <th className={cell}>2º tempo</th>
              <th className={cell}>Final</th>
              <th className={cell}>Shootouts</th>
            </tr>
          </thead>
          <tbody>
            {["Casa", "Visit."].map((side) => (
              <tr key={side}>
                <td className={cell}>{side}</td>
                <td className={`${cell} w-14`}></td>
                <td className={`${cell} w-14`}></td>
                <td className={`${cell} w-14`}></td>
                <td className={`${cell} w-16`}></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm font-bold">{match.awayTeam?.name ?? "Equipe B"}</p>
      </section>

      <section className="mt-2 rounded border border-slate-400 p-1.5">
        <p className="font-semibold">
          Fases ({p.firstHalf} + {p.secondHalf} min, tempo corrido)
        </p>
        <p>
          0&apos;–{p.staggeredEnd}&apos; escalonado (1x1 → 7x7) · {p.staggeredEnd}&apos;–{p.doubleStart}&apos; cartas e pênalti do presidente ·{" "}
          {p.doubleStart}&apos;–{p.halfTime}&apos; <strong>gols valem 2</strong> · {p.halfTime}&apos;–{p.diceEnd}&apos; dado ·{" "}
          {p.diceEnd}&apos;–{p.end}&apos; cartas e pênalti do presidente · {p.end}&apos; empate = shootouts, senão matchball.
          Amarelo = 2 min fora; vermelho = expulso e um a menos por 5 min.
        </p>
      </section>

      <section className="mt-2 grid grid-cols-2 gap-2">
        {teams.map((team, idx) => (
          <table key={idx} className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${cell} text-left`} colSpan={6}>
                  {team?.name ?? (idx === 0 ? "Equipe A" : "Equipe B")}
                </th>
              </tr>
              <tr>
                <th className={`${cell} w-7`}>Nº</th>
                <th className={`${cell} text-left`}>Jogador</th>
                <th className={`${cell} w-7`}>G</th>
                <th className={`${cell} w-14`}>Gols (min)</th>
                <th className={`${cell} w-6`}>CA</th>
                <th className={`${cell} w-6`}>CV</th>
              </tr>
            </thead>
            <tbody>
              {(team?.players ?? []).map((pl) => (
                <tr key={pl.id}>
                  <td className={`${cell} text-center`}>{pl.shirtNumber ?? ""}</td>
                  <td className={cell}>{pl.name}</td>
                  <td className={`${cell} text-center`}>{pl.isGoalkeeper ? "GOL" : ""}</td>
                  <td className={cell}></td>
                  <td className={cell}></td>
                  <td className={cell}></td>
                </tr>
              ))}
              {blankRows(Math.max(2, 14 - (team?.players.length ?? 0))).map((i) => (
                <tr key={`b-${i}`}>
                  <td className={`${cell} h-5`}></td>
                  <td className={cell}></td>
                  <td className={cell}></td>
                  <td className={cell}></td>
                  <td className={cell}></td>
                  <td className={cell}></td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </section>

      <section className="mt-2 grid grid-cols-2 gap-2">
        {teams.map((team, idx) => (
          <div key={idx} className="rounded border border-slate-400 p-1.5">
            <p className="font-semibold">{team?.name ?? (idx === 0 ? "Equipe A" : "Equipe B")}</p>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
              <span>Carta secreta:</span>
              {SECRET_CARDS.map((c) => (
                <span key={c} className="whitespace-nowrap">
                  ☐ {SECRET_CARD_LABELS[c]}
                </span>
              ))}
            </div>
            <p className="mt-1">Minuto: ______ · Alvo/batedor: ______________________ · Resultado: ______________</p>
            <p className="mt-1.5">Pênalti do presidente: minuto ______ · ☐ Gol ☐ Perdeu</p>
          </div>
        ))}
      </section>

      <section className="mt-2 grid grid-cols-[auto_1fr] gap-2">
        <div className="rounded border border-slate-400 p-1.5">
          <p className="font-semibold">Dado ({p.halfTime}&apos;)</p>
          <p className="mt-1">☐ 1x1 · ☐ 2x2 · ☐ 3x3</p>
        </div>
        <div className="rounded border border-slate-400 p-1.5">
          <p className="font-semibold">Shootouts (só em caso de empate no {p.end}&apos;)</p>
          <table className="mt-1 border-collapse">
            <tbody>
              {["Casa", "Visit."].map((side) => (
                <tr key={side}>
                  <td className="pr-2">{side}</td>
                  {blankRows(8).map((i) => (
                    <td key={i} className={`${cell} w-6`}></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-2 rounded border border-slate-400 p-1.5">
        <p className="font-semibold">Observações</p>
        <div className="h-10"></div>
      </section>

      <section className="mt-6 grid grid-cols-3 gap-4 text-center">
        {["Árbitro", `Capitão ${match.homeTeam?.name ?? "A"}`, `Capitão ${match.awayTeam?.name ?? "B"}`].map((role) => (
          <div key={role} className="border-t border-slate-900 pt-1">
            {role}
          </div>
        ))}
      </section>
    </main>
  );
}
