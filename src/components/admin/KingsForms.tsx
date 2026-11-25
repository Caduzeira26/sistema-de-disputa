"use client";

import { useActionState, useState } from "react";
import {
  addKingsGoalAction,
  addPresidentPenaltyAction,
  addSecretCardAction,
  finishKingsMatchAction,
  setDiceAction,
  type KingsActionState,
} from "@/lib/actions/kings";
import {
  GOAL_KINDS,
  GOAL_KIND_LABELS,
  SECRET_CARDS,
  SECRET_CARD_EFFECTS,
  SECRET_CARD_LABELS,
  goalValue,
  suggestGoalKind,
  type GoalKind,
  type KingsPhases,
  type SecretCard,
} from "@/lib/kings";

const initial: KingsActionState = {};
const field = "rounded-md border border-slate-300 px-2 py-1.5 text-sm";
const label = "text-xs font-medium text-slate-600";
const button =
  "rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50";

type Player = { id: string; name: string; isGoalkeeper?: boolean };
type TeamWithPlayers = { id: string; name: string; players: Player[] };

function TeamSelect({ home, away, value, onChange }: { home: TeamWithPlayers; away: TeamWithPlayers; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className={label}>Equipe</label>
      <select name="teamId" value={value} onChange={(e) => onChange(e.target.value)} className={field}>
        <option value={home.id}>{home.name}</option>
        <option value={away.id}>{away.name}</option>
      </select>
    </div>
  );
}

function PlayerSelect({ players, title, name = "playerId" }: { players: Player[]; title: string; name?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className={label}>{title}</label>
      <select name={name} required className={field}>
        {players.length === 0 ? (
          <option value="">Nenhum jogador cadastrado</option>
        ) : (
          players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.isGoalkeeper ? " (goleiro)" : ""}
            </option>
          ))
        )}
      </select>
    </div>
  );
}

function MinuteInput({ onChange }: { onChange?: (minute: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className={label}>Minuto</label>
      <input
        type="number"
        name="minute"
        min={0}
        max={200}
        required
        onChange={(e) => onChange?.(Number(e.target.value))}
        className={`w-20 ${field}`}
      />
    </div>
  );
}

export function KingsGoalForm({ matchId, homeTeam, awayTeam, phases }: { matchId: string; homeTeam: TeamWithPlayers; awayTeam: TeamWithPlayers; phases: KingsPhases }) {
  const [state, formAction, pending] = useActionState(addKingsGoalAction, initial);
  const [teamId, setTeamId] = useState(homeTeam.id);
  const [kind, setKind] = useState<GoalKind>("NORMAL");
  const [touched, setTouched] = useState(false);
  const players = teamId === homeTeam.id ? homeTeam.players : awayTeam.players;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <TeamSelect home={homeTeam} away={awayTeam} value={teamId} onChange={setTeamId} />
      <PlayerSelect players={players} title="Jogador" />
      <MinuteInput onChange={(m) => !touched && Number.isFinite(m) && setKind(suggestGoalKind(m, phases))} />
      <div className="flex flex-col gap-1">
        <label className={label}>Tipo do gol</label>
        <select
          name="kind"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as GoalKind);
            setTouched(true);
          }}
          className={field}
        >
          {GOAL_KINDS.map((k) => (
            <option key={k} value={k}>
              {GOAL_KIND_LABELS[k]} {goalValue(k) === 2 ? "· vale 2" : ""}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending || players.length === 0} className={button}>
        {pending ? "Adicionando..." : "Adicionar gol"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function SecretCardForm({ matchId, homeTeam, awayTeam }: { matchId: string; homeTeam: TeamWithPlayers; awayTeam: TeamWithPlayers }) {
  const [state, formAction, pending] = useActionState(addSecretCardAction, initial);
  const [teamId, setTeamId] = useState(homeTeam.id);
  const [card, setCard] = useState<SecretCard>("GOL_X2");
  const own = teamId === homeTeam.id ? homeTeam : awayTeam;
  const opponent = teamId === homeTeam.id ? awayTeam : homeTeam;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="flex flex-wrap items-end gap-2">
        <TeamSelect home={homeTeam} away={awayTeam} value={teamId} onChange={setTeamId} />
        <div className="flex flex-col gap-1">
          <label className={label}>Carta</label>
          <select name="card" value={card} onChange={(e) => setCard(e.target.value as SecretCard)} className={field}>
            {SECRET_CARDS.map((c) => (
              <option key={c} value={c}>
                {SECRET_CARD_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <MinuteInput />
        {card === "SUSPENSAO" && (
          <PlayerSelect players={opponent.players.filter((p) => !p.isGoalkeeper)} title={`Suspenso (${opponent.name})`} />
        )}
        {card === "JOGADOR_ESTRELA" && <PlayerSelect players={own.players} title="Jogador estrela" />}
        {(card === "PENALTI" || card === "SHOOTOUT") && (
          <>
            <PlayerSelect players={own.players} title="Batedor" />
            <div className="flex flex-col gap-1">
              <label className={label}>Resultado</label>
              <select name="scored" className={field} defaultValue="yes">
                <option value="yes">Gol</option>
                <option value="no">Perdeu</option>
              </select>
            </div>
          </>
        )}
        {card === "PENALTI_INVERSO" && (
          <div className="flex flex-col gap-1">
            <label className={label}>{opponent.name} bateu e…</label>
            <select name="scored" className={field} defaultValue="yes">
              <option value="yes">Errou (gol para {own.name})</option>
              <option value="no">Marcou (não vale nada)</option>
            </select>
          </div>
        )}
        <button type="submit" disabled={pending} className={button}>
          {pending ? "Registrando..." : "Usar carta"}
        </button>
      </div>
      <p className="text-xs text-slate-500">{SECRET_CARD_EFFECTS[card]}</p>
      {card === "GOL_X2" && (
        <p className="text-xs text-slate-500">Depois, lance os gols dos 4 minutos seguintes com o tipo “Gol com a carta Gol x2”.</p>
      )}
      {card === "CORINGA" && (
        <p className="text-xs text-slate-500">Registre o coringa aqui; os gols que ele gerar (Gol x2, jogador estrela) são aceitos como se fosse a carta usada.</p>
      )}
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function PresidentPenaltyForm({ matchId, homeTeam, awayTeam }: { matchId: string; homeTeam: TeamWithPlayers; awayTeam: TeamWithPlayers }) {
  const [state, formAction, pending] = useActionState(addPresidentPenaltyAction, initial);
  const [teamId, setTeamId] = useState(homeTeam.id);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <TeamSelect home={homeTeam} away={awayTeam} value={teamId} onChange={setTeamId} />
      <MinuteInput />
      <div className="flex flex-col gap-1">
        <label className={label}>Resultado</label>
        <select name="scored" className={field} defaultValue="yes">
          <option value="yes">Gol</option>
          <option value="no">Perdeu</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Registrando..." : "Registrar pênalti"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function DiceForm({ matchId }: { matchId: string }) {
  const [state, formAction, pending] = useActionState(setDiceAction, initial);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="flex flex-col gap-1">
        <label className={label}>Resultado do dado</label>
        <select name="result" className={field} defaultValue="1">
          <option value="1">1x1 (logo da Kings League)</option>
          <option value="2">2x2</option>
          <option value="3">3x3</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Registrando..." : "Registrar dado"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function FinishKingsMatchForm({
  matchId,
  homeName,
  awayName,
  tied,
}: {
  matchId: string;
  homeName: string;
  awayName: string;
  tied: boolean;
}) {
  const [state, formAction, pending] = useActionState(finishKingsMatchAction, initial);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      {tied && (
        <div className="flex flex-wrap items-end gap-2">
          <p className="w-full text-xs text-slate-600">Empate: na Kings League a partida vai para os shootouts. Informe o resultado.</p>
          <div className="flex flex-col gap-1">
            <label className={label}>Shootouts {homeName}</label>
            <input type="number" name="homeShootouts" min={0} required className={`w-24 ${field}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label}>Shootouts {awayName}</label>
            <input type="number" name="awayShootouts" min={0} required className={`w-24 ${field}`} />
          </div>
        </div>
      )}
      <div>
        <button type="submit" disabled={pending} className={button}>
          {pending ? "Encerrando..." : "Encerrar partida"}
        </button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
