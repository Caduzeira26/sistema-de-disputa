/** Vídeo 5 — lançar os resultados, ver o campeão e a página pública. */
const { gravar, BASE } = require("./lib.cjs");
const { DEMO, preparar, semearChaveamento, prisma } = require("./demo.cjs");

(async () => {
  const { estado, torneio } = await preparar({ torneio: true, status: "REGISTRATION_OPEN", aprovadas: true });
  await semearChaveamento(estado, torneio.id); // o sorteio já foi feito (vídeo 4)
  const admin = `/admin/torneios/${torneio.id}`;

  /** Lança o placar no primeiro jogo que ainda está aberto. */
  async function lancar(a, page, casa, fora) {
    const form = page.locator('form:has(input[name="homeScore"])').first();
    await form.scrollIntoViewIfNeeded();
    const gols = form.locator('input[name="homeScore"]');
    const golsFora = form.locator('input[name="awayScore"]');
    await a.mover(gols);
    await gols.fill(String(casa));
    await a.sleep(500);
    await a.mover(golsFora);
    await golsFora.fill(String(fora));
    await a.sleep(500);
    await a.clicar(form.getByRole("button", { name: "Salvar" }), { depois: 600 });
    await a.espera();
  }

  const saida = await gravar({
    nome: "05-resultados",
    estado,
    inicio: admin,
    etiqueta: "Vídeo 5 de 5 · Resultados",
    titulo: "Resultados e <span>campeão</span>",
    subtitulo: "Lançando os jogos e divulgando",
    abertura: "Com o chaveamento pronto, é hora de jogar! Neste vídeo você vai lançar os resultados e acompanhar a chegada do campeão.",
    encerramento: "E é isso! Você aprendeu a criar a conta, montar o campeonato, receber as equipes, sortear e lançar os resultados. Boa sorte com o seu campeonato!",
    etiquetaFim: "Fim da série",
    proximo: "Obrigado por assistir",
    passos: [
      {
        etiqueta: "Passo 1 · Os jogos",
        legenda: "Cada jogo tem o seu cartão",
        fala: "Aqui na chave, cada jogo tem um cartão, com as duas equipes. As equipes vencedoras avançam sozinhas para a fase seguinte.",
        acao: async (a, page) => {
          await a.destacar(page.getByRole("heading", { name: "Chaveamento" }), 1500);
          await a.rolar(500, 16);
          await a.sleep(600);
          await a.destacar(page.getByText("JOGO 1").first(), 4500).catch(() => {});
        },
      },
      {
        etiqueta: "Passo 2 · Lançar o placar",
        legenda: "Digite os gols e clique em “Salvar”",
        fala: "Para lançar o resultado, digite os gols de cada equipe e clique em Salvar. No mata-mata não pode haver empate: alguém precisa avançar.",
        acao: async (a, page) => {
          await lancar(a, page, 3, 1);
        },
      },
      {
        etiqueta: "Passo 2 · Lançar o placar",
        legenda: "A vencedora já avançou para a final",
        fala: "Pronto! O jogo ficou encerrado, e a equipe vencedora já aparece na fase seguinte.",
        acao: async (a, page) => {
          await a.destacar(page.getByText("Encerrada").first(), 4500).catch(() => {});
        },
      },
      {
        etiqueta: "Passo 3 · O outro jogo",
        legenda: "Lance o resultado do outro jogo",
        fala: "Fazemos o mesmo com o outro jogo da semifinal.",
        acao: async (a, page) => {
          await lancar(a, page, 2, 4);
        },
      },
      {
        etiqueta: "Passo 4 · A final",
        legenda: "Agora é a final",
        fala: "Agora a final está definida. Vamos lançar o resultado dela.",
        acao: async (a, page) => {
          await lancar(a, page, 2, 1);
        },
      },
      {
        etiqueta: "Passo 5 · O campeão",
        legenda: "Temos um campeão!",
        fala: "E temos um campeão! O sistema mostra o pódio, com o campeão, o vice-campeão e o terceiro lugar.",
        acao: async (a, page) => {
          await page.goto(BASE + admin);
          await a.espera();
          await a.destacar(page.getByText("Campeão:").first(), 6500);
          await a.sleep(6500);
        },
      },
      {
        etiqueta: "Passo 6 · Divulgar",
        legenda: "A página pública: o público acompanha tudo",
        fala: "O público acompanha tudo pela página pública do campeonato: as equipes, a chave e os resultados. É esse o link que você divulga.",
        acao: async (a, page) => {
          await page.goto(BASE + `/torneios/${DEMO.slug}`);
          await a.espera();
          await a.destacar(page.getByRole("heading", { name: /Equipes confirmadas/ }), 2500);
          await a.rolar(520, 18);
          await a.sleep(1000);
          await a.destacar(page.getByRole("heading", { name: "Chaveamento" }), 3000).catch(() => {});
        },
      },
      {
        etiqueta: "Passo 7 · Estatísticas",
        legenda: "Estatísticas: aparecem conforme você preenche a súmula",
        fala: "Esta é a página de estatísticas. Cada jogo também tem uma súmula, onde você registra os gols e os cartões. Com ela preenchida, o sistema monta sozinho a artilharia e as estatísticas do campeonato. Aqui está vazio porque lançamos só os placares.",
        acao: async (a, page) => {
          await page.goto(BASE + `/torneios/${DEMO.slug}/estatisticas`);
          await a.espera();
          await a.sleep(5500);
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
