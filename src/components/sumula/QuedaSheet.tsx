import { TournamentHeaderLogo } from "@/components/TournamentBranding";
import { SPORT_LABELS, type SportType } from "@/lib/sport";

/**
 * Folha impressa de uma queda (Free Fire) ou bateria (Just Dance): uma linha por equipe/dançarino.
 * Com `teams` vem preenchida; sem, sai em branco.
 */
export function QuedaSheet({
  sportType,
  heats,
  tournament,
  teams,
}: {
  sportType: SportType;
  /** Just Dance em baterias (colocação pela pontuação da música). */
  heats: boolean;
  tournament: { name: string; logoUrl: string | null };
  teams: { name: string; players: string[] }[] | null;
}) {
  const cell = "border border-slate-400 px-1.5 py-1";
  const line = (w: string) => <span className={`inline-block border-b border-slate-500 ${w}`}>&nbsp;</span>;
  const rows = teams ?? Array.from({ length: heats ? 4 : 12 }, () => null);
  const unit = heats ? "Bateria" : "Queda";
  return (
    <article className="text-[11px] leading-tight text-slate-900">
      <header className="flex items-center gap-3 border-b-2 border-slate-900 pb-2">
        <TournamentHeaderLogo logoUrl={tournament.logoUrl} tournamentName={tournament.name} />
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide">Súmula oficial · {SPORT_LABELS[sportType]}</p>
          <h1 className="text-base font-bold">{tournament.name}</h1>
          <p className="mt-0.5">
            {unit} nº {line("w-10")} · Grupo/rodada: {line("w-24")} · Data: {line("w-20")} · Horário: {line("w-12")} · Local:{" "}
            {line("w-32")}
          </p>
          <p className="mt-0.5">
            {heats ? "Música" : "Mapa"}: {line("w-40")} · Árbitro/mesário: {line("w-40")}
          </p>
        </div>
      </header>

      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr>
            <th className={`${cell} w-8`}>#</th>
            <th className={`${cell} text-left`}>{heats ? "Dançarino(a)" : "Equipe e jogadores"}</th>
            {heats ? (
              <>
                <th className={`${cell} w-28`}>Pontuação na música</th>
                <th className={`${cell} w-20`}>Colocação</th>
              </>
            ) : (
              <>
                <th className={`${cell} w-20`}>Colocação (1 a 12)</th>
                <th className={`${cell} w-20`}>Abates</th>
                <th className={`${cell} w-20`}>Pontos</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={i}>
              <td className={`${cell} text-center`}>{i + 1}</td>
              <td className={`${cell} ${heats ? "h-8" : "h-9"}`}>
                {t && (
                  <>
                    <strong>{t.name}</strong>
                    {!heats && t.players.length > 0 && <span className="ml-1 text-slate-600">· {t.players.join(", ")}</span>}
                  </>
                )}
              </td>
              <td className={cell}></td>
              <td className={cell}></td>
              {!heats && <td className={cell}></td>}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-2 text-[10px] text-slate-600">
        {heats
          ? "Vale a pontuação mostrada pelo jogo ao fim da música; avançam os 2 melhores da bateria. Empate: repete a música."
          : "Pontos por colocação: 1º 12, 2º 9, 3º 8, 4º 7, 5º 6, 6º 5, 7º 4, 8º 3, 9º 2, 10º 1, 11º e 12º 0. Mais 1 ponto por abate."}
      </p>

      <section className="mt-3 rounded border border-slate-400 p-1.5">
        <p className="font-semibold">Observações</p>
        <div className="h-10"></div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-6 text-center">
        {["Árbitro / mesário", "Representante das equipes"].map((role) => (
          <div key={role} className="border-t border-slate-900 pt-1">
            {role}
          </div>
        ))}
      </section>
    </article>
  );
}
