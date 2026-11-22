"use client";

import { useActionState } from "react";
import { startCheckout, type StartCheckoutState } from "@/lib/actions/subscriptions";
import type { PaymentType, PlanTier } from "@prisma/client";

const initialState: StartCheckoutState = {};

export function CheckoutButton({
  plan,
  paymentType,
  label,
  variant = "primary",
}: {
  plan: PlanTier;
  paymentType: PaymentType;
  label: string;
  variant?: "primary" | "secondary";
}) {
  const [state, formAction, pending] = useActionState(startCheckout, initialState);

  const className =
    variant === "primary"
      ? "w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      : "w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

  return (
    <form action={formAction}>
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="paymentType" value={paymentType} />
      {state.needsDocument && (
        <div className="mb-2 flex flex-col gap-1">
          <label htmlFor={`cpfCnpj-${plan}-${paymentType}`} className="text-xs font-medium text-slate-700">
            CPF ou CNPJ (necessário para emitir a cobrança)
          </label>
          <input
            id={`cpfCnpj-${plan}-${paymentType}`}
            name="cpfCnpj"
            inputMode="numeric"
            autoComplete="off"
            required
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}
      <button type="submit" disabled={pending} className={className}>
        {pending ? "Redirecionando..." : label}
      </button>
      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
