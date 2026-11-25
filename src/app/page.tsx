import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { BrandFooter } from "@/components/BrandFooter";
import { AssistantWidget } from "@/components/AssistantWidget";
import { SiteHeader } from "@/components/SiteHeader";
import { FieldLines } from "@/components/sport/FieldLines";
import { SportBall } from "@/components/sport/SportBall";
import { CORPORATE_PLAN, FREE_PLAN, PLAN_CATALOG, PLAN_ORDER, formatBRL, getEffectiveMonthlyPriceCents } from "@/lib/plans";
import { SPORT_LABELS, SPORT_TYPES } from "@/lib/sport";

export const metadata: Metadata = {
  title: "Sistema de Disputa — gestão de torneios esportivos",
  description:
    "Inscrições online, sorteio oficial, chaveamento, súmulas, tabela e estatísticas em um só lugar. Futebol, futsal, Kings League, vôlei, basquete, FIFA, Free Fire, Just Dance e mais.",
};

const FEATURES = [
  { title: "Inscrição online com QR Code", text: "As equipes se inscrevem pelo celular. Imprima o cartaz com QR Code e a logo da sua instituição." },
  { title: "Sorteio como em competição oficial", text: "Potes e cabeças de chave, uma equipe por vez, com telão ao vivo para o público acompanhar." },
  { title: "Chaveamento automático", text: "Mata-mata simples ou duplo, fase de grupos com mata-mata, pontos corridos e quedas. Os vencedores avançam sozinhos." },
  { title: "Súmula digital e estatísticas", text: "Gols, cartões, sets, faltas e pênaltis registrados na hora, com artilharia, classificação e pódio." },
  { title: "Site público do campeonato", text: "Tabela, jogos e resultados atualizados em um link que você divulga, com a logo do seu evento." },
  { title: "Mínimo de atletas por equipe", text: "O sistema bloqueia equipes incompletas e deixa completar o elenco até o prazo que você definir." },
  { title: "Inscrição paga por PIX", text: "Cobre a inscrição das equipes e acompanhe quem já pagou, nos planos Pro e Liga." },
  { title: "Cadastro de atletas e transferências", text: "Cadastro por CPF entre campeonatos e pedidos de transferência de equipe, no plano Liga." },
  { title: "Assistente que tira dúvidas", text: "Quem está inscrevendo a equipe conta com um atendente virtual para ajudar a preencher a ficha." },
] as const;

const STEPS = [
  { title: "Crie o campeonato", text: "Escolha a modalidade, o formato e as datas." },
  { title: "Receba as inscrições", text: "Compartilhe o link ou o cartaz com QR Code." },
  { title: "Faça o sorteio", text: "Defina os potes e revele as equipes ao vivo." },
  { title: "Acompanhe os jogos", text: "Lance os resultados e o público vê tudo no site." },
] as const;

const FAQ_ITEMS = [
  { question: "Preciso instalar alguma coisa?", answer: "Não. Funciona no navegador, no computador ou no celular." },
  { question: "Posso testar de graça?", answer: "Sim. Seu primeiro campeonato é por nossa conta, sem cartão de crédito." },
  {
    question: "Serve para escola e campeonato interclasse?",
    answer: "Serve. O sistema foi pensado para campeonatos de escolas, clubes e ligas, com inscrição de equipes e controle de elenco.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Pode. Você mantém o acesso até o fim do período pago e, nas compras online, tem 7 dias de garantia para pedir reembolso.",
  },
  {
    question: "Meus dados e os dos atletas estão seguros?",
    answer: "Cada organizador só acessa os próprios campeonatos e as senhas são guardadas criptografadas. Veja os detalhes na Política de Privacidade.",
  },
] as const;

const gradientText = "bg-gradient-to-r from-[#35e0b0] to-[#3fa9ff] bg-clip-text text-transparent";

function stagger(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

/** Decorative live scoreboard for the hero: a made-up match, only there to set the mood. */
function HeroScoreboard() {
  return (
    <div className="anim-float relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-30px_rgba(53,224,176,0.35)]">
      <div className="eyebrow flex items-center justify-between text-slate-500">
        <span className="flex items-center gap-2 text-red-600">
          <span className="live-dot h-2 w-2 rounded-full bg-current" />
          Ao vivo
        </span>
        <span>2º tempo · 67&apos;</span>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#35e0b0]/15 text-lg font-bold text-[#35e0b0] ring-1 ring-[#35e0b0]/40">A</div>
          <p className="mt-2 text-sm font-semibold text-slate-900">Águias FC</p>
        </div>
        <p className="font-display text-4xl font-bold tabular-nums text-slate-900">
          <span className="anim-score-pop inline-block">2</span>
          <span className="mx-2 text-slate-400">×</span>
          <span className="anim-score-pop inline-block" style={{ animationDelay: "0.25s" }}>
            1
          </span>
        </p>
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#9b7bff]/15 text-lg font-bold text-[#9b7bff] ring-1 ring-[#9b7bff]/40">L</div>
          <p className="mt-2 text-sm font-semibold text-slate-900">Leões EC</p>
        </div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-[74%] rounded-full bg-gradient-to-r from-[#35e0b0] to-[#3fa9ff]" />
      </div>

      <ul className="mt-4 flex flex-col gap-1.5 text-xs text-slate-600">
        <li className="flex items-center justify-between"><span>⚽ Gol — Águias FC</span><span className="font-mono text-slate-400">58&apos;</span></li>
        <li className="flex items-center justify-between"><span>🟨 Cartão amarelo — Leões EC</span><span className="font-mono text-slate-400">41&apos;</span></li>
        <li className="flex items-center justify-between"><span>⚽ Gol — Leões EC</span><span className="font-mono text-slate-400">29&apos;</span></li>
      </ul>
      <p className="eyebrow mt-4 text-center text-slate-400">exemplo ilustrativo</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative isolate overflow-hidden">
          <FieldLines className="-z-10 text-white/[0.06]" />
          <div className="anim-glow pointer-events-none absolute -right-24 top-10 -z-10 h-80 w-80 rounded-full bg-[#3fa9ff]/20 blur-3xl" />
          <div className="anim-glow pointer-events-none absolute -left-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-[#35e0b0]/20 blur-3xl" />

          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-28 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20">
            <div>
              <p className="eyebrow anim-kickoff text-[#35e0b0]">▪ Sistema de Disputa // gestão esportiva</p>
              <h1 className="anim-kickoff mt-5 text-4xl font-bold sm:text-5xl" style={stagger(1)}>
                Seu campeonato do apito inicial ao <span className={gradientText}>pódio</span>
              </h1>
              <p className="anim-kickoff mt-5 max-w-xl text-lg text-slate-600" style={stagger(2)}>
                Inscrições, sorteio, chaveamento, súmulas e estatísticas em um só lugar. Sem planilha e sem confusão.
              </p>
              <div className="anim-kickoff mt-8 flex flex-col gap-3 sm:flex-row" style={stagger(3)}>
                <Link href="/admin/signup" className="rounded-md bg-slate-900 px-6 py-3 text-center text-sm text-white">
                  Criar meu primeiro campeonato grátis
                </Link>
                <Link
                  href="/planos"
                  className="rounded-md border border-slate-300 px-6 py-3 text-center text-sm font-medium text-slate-700"
                >
                  Ver planos
                </Link>
              </div>
              <ul className="anim-kickoff eyebrow mt-8 flex flex-wrap gap-2 text-slate-500" style={stagger(4)}>
                <li className="rounded-full border border-slate-200 px-3 py-1.5">11 modalidades</li>
                <li className="rounded-full border border-slate-200 px-3 py-1.5">Sorteio ao vivo</li>
                <li className="rounded-full border border-slate-200 px-3 py-1.5">Teste grátis</li>
              </ul>
            </div>

            <div className="anim-kickoff flex justify-center lg:justify-end" style={stagger(2)}>
              <HeroScoreboard />
            </div>
          </div>

          {/* the ball rolls across the touchline, with a bounce and a shadow */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-2 h-24 overflow-hidden">
            <div className="anim-ball-roll absolute bottom-1 left-0">
              <div className="anim-ball-bounce">
                <SportBall className="h-11 w-11" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#35e0b0]/50 to-transparent" />
          </div>
        </section>

        {/* MODALITIES TICKER */}
        <section aria-label="Modalidades" className="border-y border-slate-200 bg-slate-100/40 py-4">
          <div className="overflow-hidden">
            <ul className="anim-marquee eyebrow flex w-max items-center gap-8 whitespace-nowrap text-slate-500">
              {[...SPORT_TYPES, ...SPORT_TYPES].map((sport, i) => (
                <li key={`${sport}-${i}`} className="flex items-center gap-8">
                  <span>{SPORT_LABELS[sport]}</span>
                  <span className="text-[#35e0b0]">◆</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <p className="eyebrow text-center text-[#35e0b0]">▪ Em campo</p>
          <h2 className="mt-3 text-center text-2xl font-bold sm:text-3xl">Tudo o que o organizador precisa</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="anim-kickoff hover-lift rounded-2xl border border-slate-200 bg-white p-5"
                style={stagger(i)}
              >
                <span className="eyebrow text-[#3fa9ff]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <p className="eyebrow text-center text-[#35e0b0]">▪ Do apito inicial ao pódio</p>
          <h2 className="mt-3 text-center text-2xl font-bold sm:text-3xl">Como funciona</h2>
          <ol className="relative mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="anim-kickoff hover-lift rounded-2xl border border-slate-200 bg-white p-5" style={stagger(index)}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#35e0b0] to-[#3fa9ff] font-display text-sm font-bold text-[#06110f]">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-bold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* PLANS */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Comece <span className={gradientText}>grátis</span>, cresça quando precisar
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
            O pacote grátis já traz um campeonato completo. Os planos pagos começam em {formatBRL(PLAN_CATALOG.START.priceMonthlyCents)}/mês.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="anim-kickoff hover-lift rounded-2xl border border-[#35e0b0]/60 bg-white p-5" style={stagger(0)}>
              <h3 className="font-bold text-slate-900">{FREE_PLAN.label}</h3>
              <p className="mt-1">
                <span className="font-display text-2xl font-bold text-slate-900">{formatBRL(FREE_PLAN.priceCents)}</span>
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm text-slate-600">
                {FREE_PLAN.features.slice(0, 3).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            {PLAN_ORDER.map((tier, i) => {
              const entry = PLAN_CATALOG[tier];
              return (
                <div
                  key={tier}
                  className={`anim-kickoff hover-lift rounded-2xl border bg-white p-5 ${entry.highlight ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200"}`}
                  style={stagger(i + 1)}
                >
                  <h3 className="font-bold text-slate-900">{entry.label}</h3>
                  <p className="mt-1">
                    <span className="font-display text-2xl font-bold text-slate-900">{formatBRL(getEffectiveMonthlyPriceCents(entry))}</span>
                    <span className="text-sm text-slate-500">/mês</span>
                  </p>
                  <ul className="mt-3 flex flex-col gap-1.5 text-sm text-slate-600">
                    {entry.features.slice(0, 3).map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="text-emerald-600">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <div className="anim-kickoff hover-lift rounded-2xl border border-[#3fa9ff]/50 bg-white p-5" style={stagger(4)}>
              <h3 className="font-bold text-slate-900">{CORPORATE_PLAN.label}</h3>
              <p className="mt-1">
                <span className="font-display text-xl font-bold text-slate-900">{formatBRL(CORPORATE_PLAN.setupPriceCents)}</span>
                <span className="text-sm text-slate-500"> + {formatBRL(CORPORATE_PLAN.priceMonthlyCents)}/mês</span>
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm text-slate-600">
                {CORPORATE_PLAN.features.slice(0, 3).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-center">
            <Link href="/planos" className="text-sm font-medium text-[#3fa9ff] underline-offset-4 hover:underline">
              Ver todos os planos e o que cada um inclui
            </Link>
          </p>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Perguntas frequentes</h2>
          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group rounded-xl border border-slate-200 bg-white p-4 open:border-[#35e0b0]/40">
                <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.question}
                    <span className="text-[#35e0b0] transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="relative isolate overflow-hidden rounded-3xl border border-[#35e0b0]/30 bg-gradient-to-br from-[#35e0b0]/15 via-[#121d20] to-[#3fa9ff]/15 px-6 py-14 text-center">
            <FieldLines className="-z-10 text-white/[0.05]" />
            <div className="anim-ball-bounce mx-auto mb-4 w-fit">
              <SportBall className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Você organiza o esporte. A gente organiza a bagunça.</h2>
            <Link href="/admin/signup" className="mt-7 inline-block rounded-md bg-slate-900 px-7 py-3 text-sm text-white">
              Criar meu primeiro campeonato grátis
            </Link>
          </div>
        </section>
      </main>

      <BrandFooter />
      <AssistantWidget />
    </div>
  );
}
