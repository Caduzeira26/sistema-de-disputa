/**
 * Vídeo 9 — pênaltis no mata-mata e súmula impressa (preenchida e em branco).
 *
 * Fora da câmera: campeonato de futsal de demonstração com 4 equipes, jogadores com RG e o sorteio feito.
 */
const { gravar, BASE } = require("./lib.cjs");
const { DEMO, preparar, prisma, semearChaveamento } = require("./demo.cjs");

(async () => {
  const { estado, torneio } = await preparar({ torneio: true, status: "IN_PROGRESS", aprovadas: true, jogadoresPorEquipe: 7 });
  // RGs fictícios e o goleiro de cada equipe, como se as equipes tivessem preenchido a ficha.
  const jogadores = await prisma.player.findMany({ where: { team: { tournamentId: torneio.id } }, orderBy: [{ teamId: "asc" }, { shirtNumber: "asc" }] });
  for (const [i, p] of jogadores.entries()) {
    await prisma.player.update({
      where: { id: p.id },
      data: { isGoalkeeper: p.shirtNumber === 1, rg: p.shirtNumber === 7 ? null : `${12 + (i % 30)}.${String(340 + i).padStart(3, "0")}.${String(560 + i * 3).padStart(3, "0")}-${i % 10}` },
    });
  }
  await semearChaveamento(estado, torneio.id);
  const admin = `/admin/torneios/${torneio.id}`;
  const jogo2 = await prisma.match.findFirst({ where: { tournamentId: torneio.id, round: 1, position: 1 } });
  const equipe = await prisma.team.findFirst({ where: { tournamentId: torneio.id }, orderBy: { name: "asc" } });

  const saida = await gravar({
    nome: "09-sumula-impressa-e-penaltis",
    estado,
    inicio: admin,
    largura: 1280,
    etiqueta: "Vídeo extra · Súmula impressa e pênaltis",
    titulo: "Súmula impressa e <span>pênaltis</span>",
    subtitulo: "Para jogar mesmo sem computador no local",
    abertura:
      "Neste vídeo você vai ver como decidir um jogo de mata-mata nos pênaltis e como imprimir a súmula oficial, já preenchida com as equipes e os jogadores, ou em branco.",
    encerramento: "Pronto! Com a súmula impressa, o jogo acontece mesmo sem computador, e o resultado entra no sistema depois. Bom campeonato!",
    etiquetaFim: "Fim",
    proximo: "Obrigado por assistir",
    passos: [
      {
        etiqueta: "Passo 1 · Pênaltis no mata-mata",
        legenda: "No mata-mata, o placar tem o campo dos pênaltis",
        fala: "Nos jogos de mata-mata, o placar agora tem também o campo dos pênaltis. Ele só precisa ser preenchido quando o jogo termina empatado. Isso vale para futebol, futsal, futebol sete e handebol, no mata-mata simples e na eliminatória dupla.",
        acao: async (a, page) => {
          const form = page.locator("form", { has: page.locator("input[name=homePenalties]") }).first();
          await form.scrollIntoViewIfNeeded();
          await a.sleep(600);
          await a.destacar(form, 7000);
          await a.sleep(7000);
        },
      },
      {
        etiqueta: "Passo 1 · Pênaltis no mata-mata",
        legenda: "Empatou? O sistema pede os pênaltis",
        fala: "Vamos lançar um empate de dois a dois e salvar sem os pênaltis. O sistema avisa que jogo eliminatório não pode terminar empatado, e o placar digitado continua lá.",
        acao: async (a, page) => {
          const form = page.locator("form", { has: page.locator("input[name=homePenalties]") }).first();
          for (const campo of ["homeScore", "awayScore"]) {
            const input = form.locator(`input[name=${campo}]`);
            await a.mover(input);
            await input.fill("2");
            await a.sleep(500);
          }
          await a.clicar(form.getByRole("button", { name: "Salvar" }), { depois: 1500 });
          await form.locator("p.text-red-600").waitFor({ timeout: 30000 });
          await a.destacar(form.locator("p.text-red-600"), 4000);
        },
      },
      {
        etiqueta: "Passo 1 · Pênaltis no mata-mata",
        legenda: "Preencha os pênaltis e salve",
        fala: "Agora informe o resultado dos pênaltis, cinco a quatro, e salve. O vencedor avança sozinho na chave, e o resultado dos pênaltis aparece entre parênteses.",
        acao: async (a, page) => {
          const form = page.locator("form", { has: page.locator("input[name=homePenalties]") }).first();
          await a.digitar(form.locator("input[name=homePenalties]"), "5", { atraso: 150 });
          await a.digitar(form.locator("input[name=awayPenalties]"), "4", { atraso: 150 });
          await a.clicar(form.getByRole("button", { name: "Salvar" }), { depois: 2500 });
          await a.espera();
          await a.destacar(page.getByText("(5)").first().locator("xpath=ancestor::div[contains(@class,'rounded-md')][1]"), 5000).catch(() => {});
          await a.sleep(5000);
        },
      },
      {
        etiqueta: "Passo 2 · Súmula impressa",
        legenda: "Na súmula do jogo, clique em “Imprimir súmula”",
        fala: "E se não der para usar o computador no local do jogo? Abra a súmula da partida e clique em Imprimir súmula.",
        acao: async (a, page) => {
          await page.goto(BASE + `${admin}/partidas/${jogo2.id}`);
          await a.espera();
          await a.clicar(page.getByRole("link", { name: "Imprimir súmula" }), { depois: 1500 });
          await a.espera();
          await a.sleep(1500);
        },
      },
      {
        etiqueta: "Passo 2 · Súmula impressa",
        legenda: "Já sai preenchida com tudo o que se sabe antes do jogo",
        fala: "A súmula oficial da modalidade já sai preenchida com tudo o que dá para saber antes do jogo: o número do jogo, a fase, a data, o horário e o local, as equipes, o técnico e os jogadores, com o número, o nome e o RG. O goleiro já vem marcado.",
        acao: async (a, page) => {
          await a.destacar(page.locator("header").first(), 5000);
          await a.sleep(5200);
          await a.destacar(page.locator("table").nth(1), 7000);
          await a.sleep(7000);
        },
      },
      {
        etiqueta: "Passo 2 · Súmula impressa",
        legenda: "O resto é preenchido à mão durante o jogo",
        fala: "O resto fica em branco para o mesário preencher durante a partida: o placar de cada tempo, os gols, os cartões, a disputa de pênaltis e as assinaturas. Depois do jogo, é só passar o resultado para o sistema.",
        acao: async (a, page) => {
          await a.rolar(900, 26);
          await a.sleep(1200);
          await a.destacar(page.getByText(/Disputa de pênaltis/).locator(".."), 5000).catch(() => {});
          await a.sleep(5000);
        },
      },
      {
        etiqueta: "Passo 3 · Súmula em branco",
        legenda: "Também existe a súmula totalmente em branco",
        fala: "Para uma emergência, também existe a súmula totalmente em branco, sem nenhum dado. O link fica aqui em cima e também na página do torneio. Cada modalidade tem a sua: vôlei com sets, basquete com quartos e faltas, e assim por diante.",
        acao: async (a, page) => {
          await page.mouse.wheel(0, -4000);
          await a.sleep(500);
          await a.clicar(page.getByRole("link", { name: "Súmula em branco" }), { depois: 1500 });
          await a.espera();
          await a.sleep(2000);
          await a.rolar(500, 16);
          await a.sleep(4000);
        },
      },
      {
        etiqueta: "Passo 4 · RG dos jogadores",
        legenda: "O RG é pedido na ficha e pode ser editado",
        fala: "O RG que aparece na súmula vem da ficha de inscrição, onde agora existe o campo RG. Se faltar algum, o organizador completa na edição da equipe e clica em Salvar jogadores.",
        acao: async (a, page) => {
          await page.goto(BASE + `${admin}/equipes/${equipe.id}/editar`);
          await a.espera();
          await page.getByRole("heading", { name: "Jogadores" }).scrollIntoViewIfNeeded();
          await a.sleep(600);
          const rg = page.getByLabel(/^RG de /).last();
          await a.digitar(rg, "33.444.555-6", { atraso: 70 });
          await a.clicar(page.getByRole("button", { name: "Salvar jogadores" }), { depois: 1500 });
          await page.getByText("Salvo!").waitFor({ timeout: 30000 });
          await a.destacar(page.getByText("Salvo!"), 2500);
        },
      },
      {
        etiqueta: "Passo 5 · Site público",
        legenda: "O público vê os pênaltis na chave",
        fala: "E no site do campeonato, o público vê a chave atualizada, com o resultado dos pênaltis ao lado do placar.",
        acao: async (a, page) => {
          await page.goto(BASE + `/torneios/${DEMO.slug}`);
          await a.espera();
          const chave = page.getByRole("heading", { name: "Chave principal" });
          await chave.scrollIntoViewIfNeeded().catch(() => {});
          await a.sleep(800);
          await a.destacar(page.getByText("(5)").first().locator("xpath=ancestor::div[contains(@class,'rounded-md')][1]"), 5000).catch(() => {});
          await a.sleep(5000);
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
