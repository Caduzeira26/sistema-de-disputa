import type { ReactNode } from "react";
import { TournamentHeaderLogo } from "@/components/TournamentBranding";
import { SECRET_CARDS, SECRET_CARD_LABELS, kingsPhases } from "@/lib/kings";
import { SPORT_LABELS, getSportFamily, shootoutLabel, supportsPenalties, type SportType } from "@/lib/sport";

/**
 * Súmula oficial impressa de cada modalidade. Com `match`/`teams` preenchidos sai com tudo o que se
 * sabe antes do jogo (equipes, jogadores, documento, data, horário e local); sem eles, sai em branco
 * para uma emergência. Depois do jogo, o resultado é passado para a súmula do sistema.
 */

export interface SumulaPlayer {
  shirtNumber: number | null;
  name: string;
  /** RG ou, na falta dele, CPF. */
  doc: string | null;
  isGoalkeeper: boolean;
}

export interface SumulaTeam {
  name: string;
  managerName: string | null;
  players: SumulaPlayer[];
}

export interface SumulaMatch {
  gameNumber: number | null;
  phase: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  knockout: boolean;
}

const cell = "border border-slate-400 px-1.5 py-1";
const blank = (n: number) => Array.from({ length: n }, (_, i) => i);
const line = (w = "w-24") => <span className={`inline-block border-b border-slate-500 ${w}`}>&nbsp;</span>;

function Box({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded border border-slate-400 p-1.5 ${className}`}>
      <p className="font-semibold">{title}</p>
      <div className="mt-1">{children}</div>
    </section>
  );
}

/** Tabela de placar por parcial (tempos, sets, quartos) com uma linha por equipe. */
function ScoreTable({ columns, names }: { columns: string[]; names: [string, string] }) {
  return (
    <table className="border-collapse">
      <thead>
        <tr>
          <th className={cell}></th>
          {columns.map((c) => (
            <th key={c} className={cell}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {names.map((n) => (
          <tr key={n}>
            <td className={`${cell} max-w-[9rem] truncate`}>{n}</td>
            {columns.map((c) => (
              <td key={c} className={`${cell} h-6 w-12`}></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ShootoutGrid({ label, names, kicks = 10 }: { label: string; names: [string, string]; kicks?: number }) {
  return (
    <Box title={`Disputa de ${label} (só se o jogo eliminatório empatar)`}>
      <table className="border-collapse">
        <tbody>
          {names.map((n) => (
            <tr key={n}>
              <td className="max-w-[8rem] truncate pr-2">{n}</td>
              {blank(kicks).map((i) => (
                <td key={i} className={`${cell} h-5 w-6`}></td>
              ))}
              <td className="pl-2">Total {line("w-10")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-[10px] text-slate-600">Marque ● para gol e ✕ para erro. Depois das 5 cobranças, alternadas até sair o vencedor.</p>
    </Box>
  );
}

type Column = { label: string; width?: string; render?: (p: SumulaPlayer) => ReactNode };

function Roster({ team, fallback, columns, minRows }: { team: SumulaTeam | null; fallback: string; columns: Column[]; minRows: number }) {
  const players = team?.players ?? [];
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className={`${cell} text-left`} colSpan={3 + columns.length}>
            {team?.name ?? fallback}
            <span className="ml-2 font-normal">Técnico/responsável: {team?.managerName ?? line("w-40")}</span>
          </th>
        </tr>
        <tr>
          <th className={`${cell} w-7`}>Nº</th>
          <th className={`${cell} text-left`}>Jogador</th>
          <th className={`${cell} w-28`}>RG / CPF</th>
          {columns.map((c) => (
            <th key={c.label} className={`${cell} ${c.width ?? "w-8"}`}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {players.map((p, i) => (
          <tr key={i}>
            <td className={`${cell} text-center`}>{p.shirtNumber ?? ""}</td>
            <td className={cell}>{p.name}</td>
            <td className={`${cell} whitespace-nowrap text-center text-[10px]`}>{p.doc ?? ""}</td>
            {columns.map((c) => (
              <td key={c.label} className={`${cell} text-center`}>
                {c.render?.(p) ?? ""}
              </td>
            ))}
          </tr>
        ))}
        {blank(Math.max(2, minRows - players.length)).map((i) => (
          <tr key={`b-${i}`}>
            <td className={`${cell} h-5`}></td>
            <td className={cell}></td>
            <td className={cell}></td>
            {columns.map((c) => (
              <td key={c.label} className={cell}></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EventLog({ title, columns, rows }: { title: string; columns: string[]; rows: number }) {
  return (
    <Box title={title}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} className={cell}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {blank(rows).map((i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c} className={`${cell} h-5`}></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

export function PrintableSumula({
  sportType,
  tournament,
  match,
  teams,
}: {
  sportType: SportType;
  tournament: { name: string; logoUrl: string | null; kingsFirstHalfMinutes: number | null; kingsSecondHalfMinutes: number | null };
  match: SumulaMatch | null;
  teams: [SumulaTeam | null, SumulaTeam | null];
}) {
  const family = getSportFamily(sportType);
  const names: [string, string] = [teams[0]?.name ?? "Equipe A", teams[1]?.name ?? "Equipe B"];
  // Em branco não se sabe a fase: o quadro de desempate aparece sempre que a modalidade tem.
  const showShootout = supportsPenalties(sportType) && (match === null || match.knockout);
  const isHandball = sportType === "HANDEBOL";
  const gk: Column = { label: "Gol.", width: "w-8", render: (p) => (p.isGoalkeeper ? "GOL" : "") };

  return (
    <article className="text-[11px] leading-tight text-slate-900">
      <header className="flex items-center gap-3 border-b-2 border-slate-900 pb-2">
        <TournamentHeaderLogo logoUrl={tournament.logoUrl} tournamentName={tournament.name} />
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide">Súmula oficial · {SPORT_LABELS[sportType]}</p>
          <h1 className="text-base font-bold">{tournament.name}</h1>
          <p className="mt-0.5">
            Jogo {match?.gameNumber ?? line("w-8")} · Fase: {match?.phase ?? line("w-28")} · Data: {match?.date ?? line("w-20")} ·
            Horário: {match?.time ?? line("w-12")} · Local: {match?.venue ?? line("w-32")}
          </p>
          <p className="mt-0.5">
            Início: {line("w-12")} · Término: {line("w-12")} · Árbitro: {line("w-40")} · Mesário: {line("w-32")}
          </p>
        </div>
      </header>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm font-bold">
          {names[0]} <span className="font-normal">x</span> {names[1]}
        </p>
        {family === "GOALS_CARDS" && (
          <ScoreTable columns={["1º tempo", "2º tempo", "Prorrog.", "Final"]} names={names} />
        )}
        {family === "KINGS" && <ScoreTable columns={["1º tempo", "2º tempo", "Final", "Shootouts"]} names={names} />}
        {family === "SETS_CARDS" && <ScoreTable columns={["Set 1", "Set 2", "Set 3", "Set 4", "Set 5", "Sets"]} names={names} />}
        {family === "PERIODS_FOULS" && <ScoreTable columns={["1º Q", "2º Q", "3º Q", "4º Q", "Prorrog.", "Final"]} names={names} />}
        {family === "TABLE_TENNIS_TIES" && <ScoreTable columns={["Jogos vencidos"]} names={names} />}
        {family === "SCORE_ONLY" && (
          <ScoreTable columns={sportType === "JUST_DANCE" ? ["Pontuação"] : ["Placar", "Prorrog."]} names={names} />
        )}
      </div>

      {family === "KINGS" && <KingsPhasesNote first={tournament.kingsFirstHalfMinutes} second={tournament.kingsSecondHalfMinutes} />}

      <section className="mt-2 grid grid-cols-2 gap-2">
        {[0, 1].map((i) => {
          const team = teams[i];
          const fallback = names[i];
          if (family === "GOALS_CARDS")
            return (
              <Roster
                key={i}
                team={team}
                fallback={fallback}
                minRows={sportType === "FUTEBOL_CAMPO" ? 18 : 14}
                columns={[gk, { label: "Gols" }, { label: "CA" }, ...(isHandball ? [{ label: "2'" }] : []), { label: "CV" }]}
              />
            );
          if (family === "KINGS")
            return <Roster key={i} team={team} fallback={fallback} minRows={14} columns={[gk, { label: "Gols", width: "w-12" }, { label: "CA" }, { label: "CV" }]} />;
          if (family === "SETS_CARDS")
            return <Roster key={i} team={team} fallback={fallback} minRows={14} columns={[{ label: "CA" }, { label: "CV" }]} />;
          if (family === "PERIODS_FOULS")
            return (
              <Roster key={i} team={team} fallback={fallback} minRows={12} columns={[{ label: "Pontos", width: "w-12" }, { label: "Faltas (1-5)", width: "w-20" }]} />
            );
          if (family === "TABLE_TENNIS_TIES") return <Roster key={i} team={team} fallback={fallback} minRows={6} columns={[]} />;
          return <Roster key={i} team={team} fallback={fallback} minRows={2} columns={[]} />;
        })}
      </section>

      <div className="mt-2 flex flex-col gap-2">
        {family === "GOALS_CARDS" && (
          <EventLog
            title={isHandball ? "Gols, cartões e exclusões (2 minutos)" : "Gols e cartões"}
            columns={["Min.", "Equipe", "Nº", "Jogador", isHandball ? "Gol / CA / 2' / CV" : "Gol / CA / CV"]}
            rows={10}
          />
        )}
        {family === "SETS_CARDS" && (
          <Box title="Sets (marque os pontos; set vai a 25, o 5º a 15, com 2 de vantagem)">
            <p>
              Tempos pedidos: {names[0]} {line("w-16")} · {names[1]} {line("w-16")}
            </p>
            <p className="mt-1">
              Substituições: {names[0]} {line("w-32")} · {names[1]} {line("w-32")}
            </p>
          </Box>
        )}
        {family === "PERIODS_FOULS" && (
          <Box title="Faltas coletivas e tempos">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className={cell}></th>
                  {["1º Q", "2º Q", "3º Q", "4º Q", "Prorrog.", "Tempos pedidos"].map((c) => (
                    <th key={c} className={cell}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {names.map((n) => (
                  <tr key={n}>
                    <td className={`${cell} max-w-[9rem] truncate`}>{n}</td>
                    {blank(6).map((i) => (
                      <td key={i} className={`${cell} h-6 w-14`}></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
        {family === "TABLE_TENNIS_TIES" && (
          <EventLog
            title="Jogos do confronto (simples ou duplas, sets a 11 pontos)"
            columns={["Jogo", `Jogador(es) ${names[0]}`, `Jogador(es) ${names[1]}`, "Set 1", "Set 2", "Set 3", "Set 4", "Set 5", "Vencedor"]}
            rows={7}
          />
        )}
        {family === "SCORE_ONLY" && sportType === "JUST_DANCE" && (
          <Box title="Música">
            <p>
              Música: {line("w-64")} · Pontuação mostrada pelo jogo ao fim da música. Vence a maior; empate, repete a música.
            </p>
          </Box>
        )}
        {family === "KINGS" && <KingsBoxes names={names} />}
        {showShootout && family !== "KINGS" && <ShootoutGrid label={shootoutLabel(sportType)} names={names} />}

        <Box title="Observações (protestos, ocorrências, lesões)">
          <div className="h-10"></div>
        </Box>
      </div>

      <section className="mt-6 grid grid-cols-3 gap-4 text-center">
        {["Árbitro", `Capitão ${names[0]}`, `Capitão ${names[1]}`].map((role) => (
          <div key={role} className="border-t border-slate-900 pt-1">
            {role}
          </div>
        ))}
      </section>
    </article>
  );
}

function KingsPhasesNote({ first, second }: { first: number | null; second: number | null }) {
  const p = kingsPhases(first, second);
  return (
    <section className="mt-2 rounded border border-slate-400 p-1.5">
      <p className="font-semibold">
        Fases ({p.firstHalf} + {p.secondHalf} min, tempo corrido)
      </p>
      <p>
        0&apos;–{p.staggeredEnd}&apos; escalonado (1x1 → 7x7) · {p.staggeredEnd}&apos;–{p.doubleStart}&apos; cartas e pênalti do presidente ·{" "}
        {p.doubleStart}&apos;–{p.halfTime}&apos; <strong>gols valem 2</strong> · {p.halfTime}&apos;–{p.diceEnd}&apos; dado · {p.diceEnd}&apos;–{p.end}&apos;
        cartas e pênalti do presidente · {p.end}&apos; empate = shootouts, senão matchball. Amarelo = 2 min fora; vermelho = expulso e um a
        menos por 5 min.
      </p>
    </section>
  );
}

function KingsBoxes({ names }: { names: [string, string] }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {names.map((n) => (
          <Box key={n} title={n}>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              <span>Carta secreta:</span>
              {SECRET_CARDS.map((c) => (
                <span key={c} className="whitespace-nowrap">
                  ☐ {SECRET_CARD_LABELS[c]}
                </span>
              ))}
            </div>
            <p className="mt-1">Minuto: {line("w-10")} · Alvo/batedor: {line("w-32")} · Resultado: {line("w-20")}</p>
            <p className="mt-1.5">Pênalti do presidente: minuto {line("w-10")} · ☐ Gol ☐ Perdeu</p>
          </Box>
        ))}
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <Box title="Dado">
          <p>☐ 1x1 · ☐ 2x2 · ☐ 3x3</p>
        </Box>
        <ShootoutGrid label="shootouts" names={names} kicks={8} />
      </div>
      <EventLog title="Gols (marque ×2 quando valer dois) e cartões" columns={["Min.", "Equipe", "Nº", "Jogador", "Gol / ×2 / CA / CV"]} rows={8} />
    </>
  );
}
