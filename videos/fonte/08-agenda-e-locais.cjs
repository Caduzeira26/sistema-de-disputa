/**
 * Vídeo 8 — agenda e locais.
 *
 * Fora da câmera: campeonato de futsal de demonstração com 8 equipes aprovadas e o sorteio feito.
 */
const { gravar, BASE } = require("./lib.cjs");
const { DEMO, preparar, prisma, semearChaveamento } = require("./demo.cjs");

const EQUIPES = ["Águias FC", "Leões EC", "Tubarões", "Falcões", "Raposas", "Panteras", "Gaviões", "Dragões"];

(async () => {
  const { estado, torneio } = await preparar({ torneio: true, status: "IN_PROGRESS", aprovadas: true, equipes: EQUIPES });
  await semearChaveamento(estado, torneio.id);
  const admin = `/admin/torneios/${torneio.id}`;
  const agenda = `${admin}/agenda`;

  const saida = await gravar({
    nome: "08-agenda-e-locais",
    estado,
    inicio: admin,
    etiqueta: "Vídeo extra · Agenda e locais",
    titulo: "Agenda e <span>locais</span>",
    subtitulo: "Datas, horários e quadras de cada jogo",
    abertura:
      "Neste vídeo você vai ver como montar a agenda do campeonato: cadastrar os locais, distribuir datas e horários de todos os jogos de uma vez, ajustar um jogo e compartilhar a agenda com as equipes.",
    encerramento: "Agenda pronta! Agora as equipes já sabem quando e onde vão jogar. Bom campeonato!",
    etiquetaFim: "Fim",
    proximo: "Obrigado por assistir",
    passos: [
      {
        etiqueta: "Passo 1 · Abrir a agenda",
        legenda: "Clique em “Gerenciar agenda e locais”",
        fala: "A agenda é montada depois do sorteio, quando os jogos já existem. Na página do torneio, clique em Gerenciar agenda e locais.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("link", { name: "Gerenciar agenda e locais" }), { depois: 1200 });
          await page.waitForURL("**/agenda", { timeout: 60000 });
          await a.espera();
        },
      },
      {
        etiqueta: "Passo 2 · Locais",
        legenda: "Cadastre as quadras ou campos",
        fala: "Primeiro, cadastre os locais onde os jogos vão acontecer, como quadras, campos ou ginásios. Digite o nome e clique em Adicionar. Vamos cadastrar duas quadras.",
        acao: async (a, page) => {
          const nome = page.getByPlaceholder("Nome do local (ex: Quadra 1)");
          const adicionar = page.getByRole("button", { name: "Adicionar" });
          await a.digitar(nome, "Quadra 1", { atraso: 70 });
          await a.clicar(adicionar, { depois: 1500 });
          await page.locator("li", { hasText: "Quadra 1" }).first().waitFor({ timeout: 30000 });
          await a.digitar(nome, "Quadra 2 (Ginásio)", { atraso: 70 });
          await a.clicar(adicionar, { depois: 1500 });
          await page.locator("li", { hasText: "Quadra 2 (Ginásio)" }).first().waitFor({ timeout: 30000 });
          await a.destacar(page.getByRole("heading", { name: "Locais" }).locator(".."), 2500);
        },
      },
      {
        etiqueta: "Passo 3 · Distribuição automática",
        legenda: "Data inicial, horário, jogos por dia e intervalo",
        fala: "Agora a distribuição automática. Informe a data do primeiro dia, o horário do primeiro jogo, quantos jogos cabem em um dia e o intervalo entre eles. O sistema usa os locais marcados, na ordem.",
        acao: async (a, page) => {
          const form = page.locator("form", { has: page.getByRole("button", { name: "Distribuir agenda" }) });
          await page.getByRole("heading", { name: "Distribuição automática" }).scrollIntoViewIfNeeded();
          await a.sleep(500);
          const data = form.locator("input[name=startDate]");
          await a.mover(data);
          await data.fill("2026-12-05");
          await a.sleep(700);
          const hora = form.locator("input[name=startTime]");
          await a.mover(hora);
          await hora.fill("08:00");
          await a.sleep(700);
          const porDia = form.locator("input[name=gamesPerDay]");
          await a.mover(porDia);
          await porDia.fill("4");
          await a.sleep(700);
          const intervalo = form.locator("input[name=intervalMinutes]");
          await a.mover(intervalo);
          await intervalo.fill("50");
          await a.sleep(700);
          await a.destacar(form.getByText("Locais a usar (na ordem)").locator(".."), 3500);
        },
      },
      {
        etiqueta: "Passo 3 · Distribuição automática",
        legenda: "Clique em “Distribuir agenda”",
        fala: "Clique em Distribuir agenda. Pronto: todos os jogos ganharam data, horário e local, respeitando a ordem da chave.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("button", { name: "Distribuir agenda" }), { depois: 2000 });
          await a.espera();
          const tabela = page.locator("table").first();
          await tabela.scrollIntoViewIfNeeded();
          await a.sleep(800);
          await a.destacar(tabela, 6000);
        },
      },
      {
        etiqueta: "Passo 4 · Ajustar um jogo",
        legenda: "Mude data, horário ou local e clique em Salvar",
        fala: "Precisa mudar um jogo específico? Altere a data, o horário ou o local direto na linha da partida e clique em Salvar. Os outros jogos continuam como estavam.",
        acao: async (a, page) => {
          const linha = page.locator("tbody tr").first();
          const hora = linha.locator("input[name=time]");
          await a.mover(hora);
          await hora.fill("08:30");
          await a.sleep(800);
          const local = linha.locator("select[name=venueId]");
          await a.mover(local);
          const opcoes = await local.locator("option").allTextContents();
          await local.selectOption({ label: opcoes.find((o) => o.includes("Ginásio")) });
          await a.sleep(800);
          await a.clicar(linha.getByRole("button", { name: "Salvar" }), { depois: 2000 });
          await a.destacar(linha, 3500);
        },
      },
      {
        etiqueta: "Passo 5 · Imprimir",
        legenda: "Clique em “Imprimir agenda”",
        fala: "Para levar para o local ou colar no mural, clique em Imprimir agenda. A lista sai organizada por data e horário, com o local de cada jogo.",
        acao: async (a, page) => {
          await page.mouse.wheel(0, -4000);
          await a.sleep(600);
          await a.clicar(page.getByRole("link", { name: "Imprimir agenda" }), { depois: 1500 });
          await a.espera();
          await a.destacar(page.locator("table").first(), 6000).catch(() => {});
          await a.sleep(3000);
        },
      },
      {
        etiqueta: "Passo 6 · Agenda pública",
        legenda: "As equipes veem a agenda no site do campeonato",
        fala: "E as equipes não precisam perguntar nada: no site público do campeonato, o botão Ver agenda mostra todos os jogos, separados por dia, com horário e local.",
        acao: async (a, page) => {
          await page.goto(BASE + `/torneios/${DEMO.slug}`);
          await a.espera();
          await a.clicar(page.getByRole("link", { name: "Ver agenda" }), { depois: 1500 });
          await a.espera();
          await a.sleep(1500);
          await a.rolar(500, 18);
          await a.sleep(4000);
        },
      },
    ],
  });
  console.log("OK", saida);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("ERRO:", e);
  await prisma.$disconnect();
  process.exit(1);
});
