import Link from "next/link";
import { PLAN_CATALOG, type PlanLimits } from "@/lib/plans";

export function PlanUsageCard({ limits, usedCount }: { limits: PlanLimits; usedCount: number }) {
  const label = limits.plan === "TRIAL" ? "Teste grátis" : PLAN_CATALOG[limits.plan].label;
  const limitText =
    limits.maxActiveTournaments === null
      ? "Campeonatos ilimitados"
      : `${usedCount} de ${limits.maxActiveTournaments} campeonato(s) usados`;
  const atLimit = limits.maxActiveTournaments !== null && usedCount >= limits.maxActiveTournaments;

  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 ${
        atLimit ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"
      }`}
    >
      <div>
        <p className="text-sm font-medium text-slate-900">Plano atual: {label}</p>
        <p className="text-sm text-slate-500">{limitText}</p>
      </div>
      <Link
        href="/planos"
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {limits.plan === "LIGA" ? "Ver planos" : "Fazer upgrade"}
      </Link>
    </div>
  );
}
