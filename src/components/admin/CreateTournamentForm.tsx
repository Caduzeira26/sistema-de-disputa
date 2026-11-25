"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createTournament, type CreateTournamentState } from "@/lib/actions/tournaments";
import { SPORT_LABELS, SPORT_TYPES, getSportFamily, type SportType } from "@/lib/sport";

const initialState: CreateTournamentState = {};

const FORMAT_OPTIONS = [
  { value: "SINGLE_ELIMINATION", label: "Eliminatória simples (mata-mata)" },
  { value: "DOUBLE_ELIMINATION", label: "Eliminatória dupla (com repescagem)" },
  { value: "GROUPS_SINGLE_ELIM", label: "Fase de grupos + eliminatória simples" },
  { value: "GROUPS_DOUBLE_ELIM", label: "Fase de grupos + eliminatória dupla" },
];

const HEATS_FORMAT_OPTION = { value: "HEATS", label: "Baterias de até 4 dançarinos (avançam os 2 melhores)" };

const KINGS_FORMAT_OPTIONS = [
  { value: "GROUPS_SINGLE_ELIM", label: "Liga (todos contra todos) + playoffs, como na Kings League" },
  { value: "SINGLE_ELIMINATION", label: "Eliminatória simples (mata-mata)" },
  { value: "DOUBLE_ELIMINATION", label: "Eliminatória dupla (com repescagem)" },
];

const LOBBY_FORMAT_OPTIONS = [
  { value: "LOBBY_LEAGUE", label: "Quedas em pontos corridos (com grande final opcional)" },
];

export function CreateTournamentForm({ allowedSports }: { allowedSports: readonly SportType[] }) {
  const [state, formAction, pending] = useActionState(createTournament, initialState);
  const [sport, setSport] = useState<SportType>(allowedSports[0]);
  const formatOptions =
    getSportFamily(sport) === "LOBBY_POINTS"
      ? LOBBY_FORMAT_OPTIONS
      : sport === "JUST_DANCE"
        ? [...FORMAT_OPTIONS, HEATS_FORMAT_OPTION]
        : sport === "KINGS_LEAGUE"
          ? KINGS_FORMAT_OPTIONS
          : FORMAT_OPTIONS;

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nome do torneio
        </label>
        <input
          id="name"
          name="name"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">
          Descrição (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sportType" className="text-sm font-medium text-slate-700">
          Modalidade
        </label>
        <select
          id="sportType"
          name="sportType"
          value={sport}
          onChange={(e) => setSport(e.target.value as SportType)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          {allowedSports.map((sport) => (
            <option key={sport} value={sport}>
              {SPORT_LABELS[sport]}
            </option>
          ))}
        </select>
        {allowedSports.length < SPORT_TYPES.length && (
          <p className="text-xs text-slate-400">
            Mais modalidades disponíveis nos planos Pro e Liga.{" "}
            <Link href="/planos" className="underline">
              Ver planos
            </Link>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="format" className="text-sm font-medium text-slate-700">
          Formato de disputa
        </label>
        <select
          id="format"
          name="format"
          key={sport}
          defaultValue={formatOptions[0].value}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          {formatOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {sport === "KINGS_LEAGUE" && (
          <p className="text-xs text-slate-500">
            Na liga, todos jogam contra todos e depois vem o mata-mata. No sorteio, use 1 grupo e escolha quantos avançam
            (na Kings League Brasil são 7: o 1º vai direto à semifinal).
          </p>
        )}
      </div>

      {sport === "KINGS_LEAGUE" && (
        <fieldset className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
          <legend className="px-1 text-sm font-medium text-slate-700">Duração da partida</legend>
          <p className="text-xs text-slate-500">
            O oficial é 20 + 16 minutos. Para jogos mais curtos, diminua: as fases (escalonado, gol em dobro, dado e
            matchball) acompanham.
          </p>
          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="kingsFirstHalfMinutes" className="text-xs font-medium text-slate-600">
                1º tempo (min)
              </label>
              <input
                id="kingsFirstHalfMinutes"
                name="kingsFirstHalfMinutes"
                type="number"
                min={4}
                max={45}
                defaultValue={20}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="kingsSecondHalfMinutes" className="text-xs font-medium text-slate-600">
                2º tempo (min)
              </label>
              <input
                id="kingsSecondHalfMinutes"
                name="kingsSecondHalfMinutes"
                type="number"
                min={4}
                max={45}
                defaultValue={16}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </fieldset>
      )}

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="startDate" className="text-sm font-medium text-slate-700">
            Início (opcional)
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="endDate" className="text-sm font-medium text-slate-700">
            Término (opcional)
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Criando..." : "Criar torneio"}
      </button>
    </form>
  );
}
