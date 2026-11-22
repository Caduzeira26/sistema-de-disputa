import Link from "next/link";
import { auth } from "@/lib/auth";
import { BrandFooter } from "@/components/BrandFooter";
import { AssistantWidget } from "@/components/AssistantWidget";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PromoCountdown } from "@/components/PromoCountdown";
import { SiteHeader } from "@/components/SiteHeader";
import { isAsaasConfigured } from "@/lib/asaas";
import { whatsappLink } from "@/lib/business";
import {
  CORPORATE_PLAN,
  FREE_PLAN,
  PLAN_CATALOG,
  PLAN_ORDER,
  formatBRL,
  getEffectiveMonthlyPriceCents,
  isPromoActive,
} from "@/lib/plans";

const FAQ_ITEMS = [
  {
    question: "Posso testar de graça?",
    answer:
      "Sim! O pacote Grátis inclui 1 campeonato completo, com até 16 equipes, em futebol de campo ou futsal, com inscrição online, sorteio, chaveamento e site público. Sem cartão e sem prazo.",
  },
  {
    question: "Como funciona o plano Corporativo?",
    answer:
      "É o sistema completo instalado para a sua organização, com o site dos campeonatos no seu próprio domínio e tudo o que os outros planos têm. A instalação custa R$ 1.200 (uma vez) e a mensalidade é de R$ 200. Como a instalação é feita pela nossa equipe, esse plano é combinado direto pelo WhatsApp.",
  },
  {
    question: "Como eu pago? E quando o plano é liberado?",
    answer:
      "Você escolhe PIX, boleto, cartão de crédito ou cartão de débito. No PIX e no cartão, o plano é liberado assim que o pagamento é aprovado. No boleto, o plano só é liberado depois que o valor for compensado, em geral 1 a 2 dias úteis após o pagamento.",
  },
  {
    question: "E se eu já tenho campeonato rolando?",
    answer: "Importamos tudo em 1 dia para você.",
  },
  {
    question: "O dinheiro do PIX cai pra quem?",
    answer:
      "Você recebe o valor da inscrição, descontada apenas nossa taxa de R$ 2,00 por inscrição paga. Hoje o repasse é feito por nós logo após a confirmação do pagamento; repasse automático direto na sua conta está a caminho.",
  },
];

export default async function PlansPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const proEntry = PLAN_CATALOG.PRO;
  const proPromoActive = isPromoActive(proEntry);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12">
        {proPromoActive && (
          <div className="mb-8 flex flex-col items-center gap-1 rounded-lg bg-emerald-600 px-4 py-3 text-center text-white">
            <p className="font-semibold">
              OFERTA DE LANÇAMENTO — De {formatBRL(proEntry.priceMonthlyCents)} por{" "}
              {formatBRL(proEntry.promoPriceMonthlyCents!)}/mês no plano Pro
            </p>
            <p className="text-sm text-emerald-50">
              Termina em <PromoCountdown endsAtIso={proEntry.promoEndsAt!.toISOString()} />
            </p>
          </div>
        )}

        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Planos</h1>
          <p className="mt-2 text-slate-500">Comece de graça e escolha um plano só quando precisar.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {/* Pacote grátis: visível para todos, antes de qualquer cadastro */}
          <div className="relative flex flex-col rounded-xl border border-[#35e0b0]/60 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(53,224,176,0.55)]">
            <span className="mb-3 w-fit rounded-full bg-[#35e0b0]/15 px-3 py-1 text-xs font-medium text-[#35e0b0]">
              COMECE AQUI
            </span>
            <h2 className="text-xl font-semibold text-slate-900">{FREE_PLAN.label}</h2>
            <p className="mt-2">
              <span className="text-3xl font-semibold text-slate-900">{formatBRL(FREE_PLAN.priceCents)}</span>
              <span className="text-sm text-slate-500"> para sempre</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">Seu primeiro campeonato, por nossa conta.</p>
            <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-slate-600">
              {FREE_PLAN.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link
                href={isLoggedIn ? "/admin/torneios/novo" : "/admin/signup"}
                className="block w-full rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
              >
                {isLoggedIn ? "Criar meu campeonato" : "Criar conta grátis"}
              </Link>
            </div>
          </div>

          {PLAN_ORDER.map((tier) => {
            const entry = PLAN_CATALOG[tier];
            const effectivePrice = getEffectiveMonthlyPriceCents(entry);
            const entryPromoActive = isPromoActive(entry);
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
                  {entryPromoActive && (
                    <span className="mr-2 text-lg text-slate-400 line-through">{formatBRL(entry.priceMonthlyCents)}</span>
                  )}
                  <span className="text-3xl font-semibold text-slate-900">{formatBRL(effectivePrice)}</span>
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
                        label={`Assinar agora — ${formatBRL(effectivePrice)}/mês`}
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

        {/* Corporativo: sistema completo, com site no domínio do cliente; contratado falando com a equipe */}
        <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#3fa9ff]/40 bg-white p-6 shadow-[0_20px_60px_-35px_rgba(63,169,255,0.6)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#3fa9ff]/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_1.1fr_auto] lg:items-center">
            <div>
              <span className="mb-3 inline-block w-fit rounded-full bg-[#3fa9ff]/15 px-3 py-1 text-xs font-medium text-[#3fa9ff]">
                PARA ORGANIZAÇÕES
              </span>
              <h2 className="text-2xl font-semibold text-slate-900">{CORPORATE_PLAN.label}</h2>
              <p className="mt-2 text-sm text-slate-500">
                O sistema completo, instalado para você, com o site dos seus campeonatos no seu próprio domínio.
              </p>
              <p className="mt-4">
                <span className="text-3xl font-semibold text-slate-900">{formatBRL(CORPORATE_PLAN.setupPriceCents)}</span>
                <span className="text-sm text-slate-500"> de instalação (uma vez)</span>
              </p>
              <p className="mt-1">
                <span className="text-2xl font-semibold text-slate-900">+ {formatBRL(CORPORATE_PLAN.priceMonthlyCents)}</span>
                <span className="text-sm text-slate-500">/mês</span>
              </p>
            </div>

            <ul className="flex flex-col gap-2 text-sm text-slate-600">
              {CORPORATE_PLAN.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2 lg:w-56">
              <a
                href={whatsappLink(
                  `Olá! Vim pelo Sistema de Disputa e quero saber mais sobre o plano Corporativo (instalação de ${formatBRL(CORPORATE_PLAN.setupPriceCents)} + ${formatBRL(CORPORATE_PLAN.priceMonthlyCents)}/mês).`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
              >
                Falar com a equipe no WhatsApp
              </a>
              <p className="text-center text-xs text-slate-400">Este plano é combinado direto com a nossa equipe.</p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          {isAsaasConfigured()
            ? "Pague por PIX, boleto, cartão de crédito ou débito. Assinaturas mensais são renovadas manualmente — a cada mês você paga uma nova cobrança. No boleto, o plano é liberado depois que o valor for compensado."
            : "Assinaturas mensais são renovadas manualmente — você paga um novo PIX a cada mês."}
        </p>

        {/* Comparativo rápido */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-semibold text-slate-900">
            Por que organizadores estão saindo da planilha?
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <p className="font-semibold text-red-800">❌ Planilha</p>
              <p className="mt-2 text-sm text-red-700">
                Erro na tabela, briga por artilharia, ninguém acha o jogo.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="font-semibold text-emerald-800">✅ Nosso sistema</p>
              <p className="mt-2 text-sm text-emerald-700">
                Tudo automático, site profissional e o atleta se inscreve e paga sozinho no PIX.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-semibold text-slate-900">Perguntas frequentes</h2>
          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="rounded-lg border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-medium text-slate-900">{item.question}</summary>
                <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Chamada final */}
        <div className="mt-20 rounded-xl bg-slate-900 px-6 py-12 text-center text-white">
          <h2 className="text-2xl font-semibold">Você organiza o esporte. A gente organiza a bagunça.</h2>
          <Link
            href={isLoggedIn ? "/admin/torneios/novo" : "/admin/signup"}
            className="mt-6 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            CRIAR MEU PRIMEIRO CAMPEONATO GRÁTIS AGORA
          </Link>
        </div>
      </main>
      <BrandFooter />
      <AssistantWidget />
    </div>
  );
}
