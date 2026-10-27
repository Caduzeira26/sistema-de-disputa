import type { Metadata } from "next";
import Link from "next/link";
import { BrandFooter } from "@/components/BrandFooter";
import { AssistantWidget } from "@/components/AssistantWidget";
import { PLAN_CATALOG, PLAN_ORDER, formatBRL, getEffectiveMonthlyPriceCents } from "@/lib/plans";
import { SPORT_LABELS, SPORT_TYPES } from "@/lib/sport";

export const metadata: Metadata = {
  title: "Sistema de Disputa — gestão de torneios esportivos",
  description:
    "Inscrições online, sorteio oficial, chaveamento, súmulas, tabela e estatísticas em um só lugar. Futebol, futsal, vôlei, basquete, FIFA, Free Fire, Just Dance e mais.",
};

const FEATURES = [
  {
    title: "Inscrição online com QR Code",
    text: "As equipes se inscrevem pelo celular. Imprima o cartaz com QR Code e a logo da sua instituição.",
  },
  {
    title: "Sorteio como em competição oficial",
    text: "Potes e cabeças de chave, uma equipe por vez, com telão ao vivo para o público acompanhar.",
  },
  {
    title: "Chaveamento automático",
    text: "Mata-mata simples ou duplo, fase de grupos com mata-mata, pontos corridos e quedas. Os vencedores avançam sozinhos.",
  },
  {
    title: "Súmula digital e estatísticas",
    text: "Gols, cartões, sets, faltas e pênaltis registrados na hora, com artilharia, classificação e pódio.",
  },
  {
    title: "Site público do campeonato",
    text: "Tabela, jogos e resultados atualizados em um link que você divulga, com a logo do seu evento.",
  },
  {
    title: "Mínimo de atletas por equipe",
    text: "O sistema bloqueia equipes incompletas e deixa completar o elenco até o prazo que você definir.",
  },
  {
    title: "Inscrição paga por PIX",
    text: "Cobre a inscrição das equipes e acompanhe quem já pagou, nos planos Pro e Liga.",
  },
  {
    title: "Cadastro de atletas e transferências",
    text: "Cadastro por CPF entre campeonatos e pedidos de transferência de equipe, no plano Liga.",
  },
  {
    title: "Assistente que tira dúvidas",
    text: "Quem está inscrevendo a equipe conta com um atendente virtual para ajudar a preencher a ficha.",
  },
] as const;

const STEPS = [
  { title: "Crie o campeonato", text: "Escolha a modalidade, o formato e as datas." },
  { title: "Receba as inscrições", text: "Compartilhe o link ou o cartaz com QR Code." },
  { title: "Faça o sorteio", text: "Defina os potes e revele as equipes ao vivo." },
  { title: "Acompanhe os jogos", text: "Lance os resultados e o público vê tudo no site." },
] as const;

const FAQ_ITEMS = [
  {
    question: "Preciso instalar alguma coisa?",
    answer: "Não. Funciona no navegador, no computador ou no celular.",
  },
  {
    question: "Posso testar de graça?",
    answer: "Sim. Seu primeiro campeonato é por nossa conta, sem cartão de crédito.",
  },
  {
    question: "Serve para escola e campeonato interclasse?",
    answer:
      "Serve. O sistema foi pensado para campeonatos de escolas, clubes e ligas, com inscrição de equipes e controle de elenco.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Pode. Você mantém o acesso até o fim do período pago e, nas compras online, tem 7 dias de garantia para pedir reembolso.",
  },
  {
    question: "Meus dados e os dos atletas estão seguros?",
    answer:
      "Cada organizador só acessa os próprios campeonatos e as senhas são guardadas criptografadas. Veja os detalhes na Política de Privacidade.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-semibold text-slate-900">Sistema de Disputa</span>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/planos" className="hover:text-slate-900">
              Planos
            </Link>
            <Link href="/admin/login" className="hover:text-slate-900">
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Seu campeonato organizado do início ao pódio
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Inscrições, sorteio, chaveamento, súmulas e estatísticas em um só lugar. Sem planilha e sem confusão.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/admin/signup"
              className="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Criar meu primeiro campeonato grátis
            </Link>
            <Link
              href="/planos"
              className="rounded-md border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-white"
            >
              Ver planos
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-center text-2xl font-semibold text-slate-900">Tudo o que o organizador precisa</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-center text-2xl font-semibold text-slate-900">Modalidades</h2>
          <p className="mt-2 text-center text-slate-600">Esportes tradicionais e jogos eletrônicos, cada um com as suas regras.</p>
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {SPORT_TYPES.map((sport) => (
              <li key={sport} className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm text-slate-700">
                {SPORT_LABELS[sport]}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-center text-2xl font-semibold text-slate-900">Como funciona</h2>
          <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-center text-2xl font-semibold text-slate-900">Planos a partir de {formatBRL(PLAN_CATALOG.START.priceMonthlyCents)}/mês</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {PLAN_ORDER.map((tier) => {
              const entry = PLAN_CATALOG[tier];
              return (
                <div
                  key={tier}
                  className={`rounded-xl border bg-white p-5 ${entry.highlight ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200"}`}
                >
                  <h3 className="font-semibold text-slate-900">{entry.label}</h3>
                  <p className="mt-1">
                    <span className="text-2xl font-semibold text-slate-900">{formatBRL(getEffectiveMonthlyPriceCents(entry))}</span>
                    <span className="text-sm text-slate-500">/mês</span>
                  </p>
                  <ul className="mt-3 flex flex-col gap-1 text-sm text-slate-600">
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
          </div>
          <p className="mt-6 text-center">
            <Link href="/planos" className="text-sm font-medium text-slate-700 underline">
              Comparar todos os planos
            </Link>
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-center text-2xl font-semibold text-slate-900">Perguntas frequentes</h2>
          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="rounded-lg border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-medium text-slate-900">{item.question}</summary>
                <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="rounded-xl bg-slate-900 px-6 py-12 text-center text-white">
            <h2 className="text-2xl font-semibold">Você organiza o esporte. A gente organiza a bagunça.</h2>
            <Link
              href="/admin/signup"
              className="mt-6 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
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
