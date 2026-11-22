/** Vídeo 4 — sorteio e chaveamento. */
const { gravar, BASE } = require("./lib.cjs");
const { preparar, prisma } = require("./demo.cjs");

(async () => {
  const { estado, torneio } = await preparar({ torneio: true, status: "REGISTRATION_OPEN", aprovadas: true });
  const admin = `/admin/torneios/${torneio.id}`;
  const saida = await gravar({
    nome: "04-sorteio",
    estado,
    inicio: admin,
    etiqueta: "Vídeo 4 de 5 · Sorteio",
    titulo: "Sorteio e <span>chaveamento</span>",
    subtitulo: "Como numa competição oficial",
    abertura: "Neste vídeo vamos fazer o sorteio das equipes e gerar o chaveamento, que é a tabela de jogos do campeonato.",
    encerramento: "Chaveamento pronto! No próximo vídeo, vamos lançar os resultados e descobrir o campeão.",
    proximo: "Resultados e campeão",
    passos: [
      {
        etiqueta: "Passo 1 · Começar o sorteio",
        legenda: "Clique em “Realizar o sorteio”",
        fala: "Na página do torneio, role até a seção Chaveamento e clique em Realizar o sorteio. As quatro equipes aprovadas já estão prontas.",
        acao: async (a, page) => {
          await a.destacar(page.getByRole("heading", { name: "Chaveamento" }), 2500);
          await a.sleep(1500);
          await a.clicar(page.getByRole("link", { name: "Realizar o sorteio" }), { depois: 1200 });
          await a.espera();
        },
      },
      {
        etiqueta: "Passo 2 · Potes (opcional)",
        legenda: "Potes: use para separar as equipes mais fortes",
        fala: "Aqui você pode dividir as equipes em potes. O pote 1 reúne as mais fortes, as cabeças de chave, para elas não se enfrentarem logo no começo. Se não quiser isso, deixe em branco e o sorteio será totalmente aberto.",
        acao: async (a, page) => {
          await a.destacar(page.getByRole("heading", { name: "Potes" }), 3000);
          await a.sleep(3500);
          await a.destacar(page.locator("table").first(), 5000);
        },
      },
      {
        etiqueta: "Passo 3 · Iniciar",
        legenda: "Clique em “Iniciar o sorteio”",
        fala: "Clique em Iniciar o sorteio.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("button", { name: "Iniciar o sorteio" }), { depois: 1000 });
          await page.getByRole("button", { name: "Sortear próxima equipe" }).waitFor({ timeout: 60000 });
          await a.espera();
        },
      },
      {
        etiqueta: "Passo 4 · Sortear",
        legenda: "Uma equipe de cada vez",
        fala: "Agora o sorteio acontece como numa competição oficial. A cada clique em Sortear próxima equipe, uma equipe é revelada e ocupa o seu lugar na chave.",
        acao: async (a, page) => {
          const botao = page.getByRole("button", { name: "Sortear próxima equipe" });
          await a.clicar(botao, { depois: 500 });
          await page.getByText("1 de 4 equipes sorteadas").waitFor({ timeout: 60000 });
          await a.sleep(1500);
          await a.clicar(botao, { depois: 500 });
          await page.getByText("2 de 4 equipes sorteadas").waitFor({ timeout: 60000 });
          await a.espera();
        },
      },
      {
        etiqueta: "Passo 4 · Sortear",
        legenda: "Dá para projetar o sorteio ao vivo",
        fala: "Repare neste link: é a tela pública do sorteio. Abra num telão, ou num computador ligado ao projetor, e todo mundo acompanha ao vivo, equipe por equipe.",
        acao: async (a, page) => {
          await a.destacar(page.getByText("Tela pública para projetar ao vivo").first(), 6000);
        },
      },
      {
        etiqueta: "Passo 5 · Revelar o restante",
        legenda: "Clique em “Revelar todas”",
        fala: "Para terminar de uma vez, clique em Revelar todas.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("button", { name: "Revelar todas" }), { depois: 800 });
          await page.getByRole("button", { name: "Confirmar sorteio e gerar chaveamento" }).waitFor({ timeout: 60000 });
          await a.espera();
        },
      },
      {
        etiqueta: "Passo 6 · Confirmar",
        legenda: "Confirme para gerar o chaveamento",
        fala: "Quando estiver tudo certo, clique em Confirmar sorteio e gerar chaveamento. Depois de confirmado, o resultado não muda mais.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("button", { name: "Confirmar sorteio e gerar chaveamento" }), { depois: 800 });
          await page.getByText("Sorteio concluído").waitFor({ timeout: 60000 });
          await a.espera();
          await a.destacar(page.getByText("Sorteio concluído").first(), 3500);
        },
      },
      {
        etiqueta: "Passo 7 · Pronto!",
        legenda: "Este é o chaveamento do campeonato",
        fala: "Pronto! Esta é a chave do campeonato, com as semifinais e a final. As equipes vencedoras avançam sozinhas.",
        acao: async (a, page) => {
          await page.goto(BASE + admin);
          await a.espera();
          await a.destacar(page.getByRole("heading", { name: "Chaveamento" }), 1500);
          await a.rolar(520, 18);
          await a.sleep(800);
          await a.destacar(page.getByText("JOGO 1").first(), 4000).catch(() => {});
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
