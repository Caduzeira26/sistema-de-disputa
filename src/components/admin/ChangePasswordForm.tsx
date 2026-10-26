"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "@/lib/actions/auth";

const initialState: ChangePasswordState = {};

const inputClass = "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
          Senha atual
        </label>
        <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Nova senha
        </label>
        <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
          Confirmar nova senha
        </label>
        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Senha alterada com sucesso! Use a nova senha no próximo login.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Alterar senha"}
      </button>
    </form>
  );
}
