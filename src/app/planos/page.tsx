import Link from "next/link";
import { auth } from "@/lib/auth";
import { BrandFooter } from "@/components/BrandFooter";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PLAN_CATALOG, PLAN_ORDER, formatBRL } from "@/lib/plans";

export default async function PlansPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Planos</h1>
          <p className="mt-2 text-slate-500">Escolha o plano ideal para o seu campeonato.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLAN_ORDER.map((tier) => {
            const entry = PLAN_CATALOG[tier];
            return (
              <div
                key={tier}
                className={`flex flex-col rounded-xl border bg-white p-6 ${
                  entry.highlight ? "border-slate-900 shadow-lg ring-1 ring-slate-900" : "border-slate-200"
                }`}
              >
                {entry.highlight && (
                  <span className="mb-3 w-fit rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                    MAIS POPULAR
                  </span>
                )}

                <h2 className="text-xl font-semibold text-slate-900">{entry.label}</h2>
                <p className="mt-2">
                  <span className="text-3xl font-semibold text-slate-900">{formatBRL(entry.priceMonthlyCents)}</span>
                  <span className="text-sm text-slate-500">/mês</span>
                </p>
                {entry.priceAvulsoCents && (
                  <p className="mt-1 text-sm text-slate-500">ou {formatBRL(entry.priceAvulsoCents)} por campeonato avulso</p>
                )}

                <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-slate-600">
                  {entry.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-600">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-col gap-2">
                  {isLoggedIn ? (
                    <>
                      <CheckoutButton
                        plan={tier}
                        paymentType="MONTHLY"
                        label={`Assinar agora — ${formatBRL(entry.priceMonthlyCents)}/mês`}
                        variant={entry.highlight ? "primary" : "secondary"}
                      />
                      {entry.priceAvulsoCents && (
                        <CheckoutButton
                          plan={tier}
                          paymentType="PER_TOURNAMENT"
                          label={`Comprar avulso — ${formatBRL(entry.priceAvulsoCents)}`}
                          variant="secondary"
                        />
                      )}
                    </>
                  ) : (
                    <Link
                      href="/admin/signup"
                      className={
                        entry.highlight
                          ? "w-full rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
                          : "w-full rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                      }
                    >
                      Criar conta e assinar
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          Assinaturas mensais são renovadas manualmente — você paga um novo PIX a cada mês.
        </p>
      </main>
      <BrandFooter />
    </div>
  );
}
