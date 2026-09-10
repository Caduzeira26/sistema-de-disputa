"use client";

import { useActionState } from "react";
import { createTournament, type CreateTournamentState } from "@/lib/actions/tournaments";
import { SPORT_TYPES, SPORT_LABELS } from "@/lib/sport";

const initialState: CreateTournamentState = {};

const FORMAT_OPTIONS = [
  { value: "SINGLE_ELIMINATION", label: "Eliminatória simples (mata-mata)" },
  { value: "DOUBLE_ELIMINATION", label: "Eliminatória dupla (com repescagem)" },
  { value: "GROUPS_SINGLE_ELIM", label: "Fase de grupos + eliminatória simples" },
  { value: "GROUPS_DOUBLE_ELIM", label: "Fase de grupos + eliminatória dupla" },
];

export function CreateTournamentForm() {
  const [state, formAction, pending] = useActionState(createTournament, initialState);

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
          defaultValue="FUTEBOL_CAMPO"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          {SPORT_TYPES.map((sport) => (
            <option key={sport} value={sport}>
              {SPORT_LABELS[sport]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="format" className="text-sm font-medium text-slate-700">
          Formato de disputa
        </label>
        <select
          id="format"
          name="format"
          defaultValue="SINGLE_ELIMINATION"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          {FORMAT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

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
