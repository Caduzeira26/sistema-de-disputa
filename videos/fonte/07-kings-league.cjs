/**
 * Vídeo 7 — campeonato no formato Kings League.
 *
 * Fora da câmera: organizador de demonstração com plano Pro, um campeonato Kings League com
 * 8 equipes aprovadas e o sorteio já feito (liga com 1 grupo, 7 avançam).
 */
const { gravar, BASE } = require("./lib.cjs");
const { preparar, prisma, usuario, semearChaveamento } = require("./demo.cjs");

const EQUIPES = ["Raposas FC", "Tubarões", "Leões da Serra", "Furacão", "Trovão", "Gaviões", "Panteras", "Dragões"];
const TORNEIO = "Kings League Digita Money";
const SLUG = "kings-league-digita-money";

async function criarCampeonato() {
  const u = await usuario();
  await prisma.subscription.create({
    data: { userId: u.id, plan: "PRO", status: "ACTIVE", paymentType: "MONTHLY", startDate: new Date(), endDate: new Date(Date.now() + 30 * 864e5) },
  });
  const t = await prisma.tournament.create({
    data: { name: TORNEIO, slug: SLUG, format: "GROUPS_SINGLE_ELIM", sportType: "KINGS_LEAGUE", status: "REGISTRATION_CLOSED", organizerId: u.id },
  });
  for (const nome of EQUIPES) {
    const players = [];
    for (let i = 1; i <= 8; i++) {
      const a = await prisma.athlete.create({ data: { name: `${nome} ${i}` } });
      players.push({ athleteId: a.id, name: `${nome} ${i}`, shirtNumber: i, isGoalkeeper: i === 1 });
    }
    await prisma.team.create({ data: { tournamentId: t.id, name: nome, managerName: "Presidente " + nome, status: "APPROVED", players: { create: players } } });
  }
  return t;
}

/** Encerra os outros jogos da liga (fora da câmera), com alguns empates decididos nos shootouts. */
async function encerrarLiga(tournamentId, exceto) {
  const ms = await prisma.match.findMany({
    where: { tournamentId, bracket: "GROUP", status: { not: "FINISHED" }, id: { not: exceto } },
    orderBy: [{ round: "asc" }, { position: "asc" }],
  });
  let i = 0;
  for (const m of ms) {
    i++;
    const empate = i % 3 === 0;
    const data = empate
      ? { homeScore: 2, awayScore: 2, homePenalties: i % 2 ? 3 : 1, awayPenalties: i % 2 ? 1 : 2 }
      : { homeScore: (i % 4) + 2, awayScore: i % 4, homePenalties: null, awayPenalties: null };
    await prisma.match.update({ where: { id: m.id }, data: { ...data, status: "FINISHED" } });
  }
}

(async () => {
  const { estado } = await preparar();
  const torneio = await criarCampeonato();
  await semearChaveamento(estado, torneio.id);
  const admin = `/admin/torneios/${torneio.id}`;
  const jogo = await prisma.match.findFirst({
    where: { tournamentId: torneio.id, bracket: "GROUP" },
    orderBy: [{ round: "asc" }, { position: "asc" }],
    include: { homeTeam: { include: { players: { orderBy: { shirtNumber: "asc" } } } }, awayTeam: { include: { players: { orderBy: { shirtNumber: "asc" } } } } },
  });
  const casa = jogo.homeTeam;
  const fora = jogo.awayTeam;
  const sumula = `${admin}/partidas/${jogo.id}`;

  const form = (page, campo) => page.locator("form", { has: page.locator(campo) }).first();

  const saida = await gravar({
    nome: "07-kings-league",
    estado,
    inicio: "/admin/torneios/novo",
    largura: 1280,
    etiqueta: "Vídeo extra · Kings League",
    titulo: "Campeonato no formato <span>Kings League</span>",
    subtitulo: "Súmula, cartas secretas, shootouts e playoffs",
    abertura:
      "Neste vídeo você vai ver como organizar um campeonato com as regras da Kings League: a súmula com gol em dobro, cartas secretas, pênalti do presidente e dado, os shootouts, a classificação e os playoffs.",
    encerramento: "Agora é com você: monte a sua Kings League e boa diversão!",
    etiquetaFim: "Fim",
    proximo: "Obrigado por assistir",
    passos: [
      {
        etiqueta: "Passo 1 · Criar o campeonato",
        legenda: "Escolha a modalidade Kings League",
        fala: "Para criar, vá em Novo torneio e escolha a modalidade Kings League. O formato já vem como liga, todos contra todos, seguida de playoffs.",
        acao: async (a, page) => {
          await a.digitar(page.getByLabel("Nome do torneio"), "Minha Kings League", { atraso: 55 });
          await a.mover(page.getByLabel("Modalidade"));
          await page.getByLabel("Modalidade").selectOption("KINGS_LEAGUE");
          await a.sleep(800);
          await a.destacar(page.getByLabel("Formato de disputa"), 4500);
        },
      },
      {
        etiqueta: "Passo 1 · Criar o campeonato",
        legenda: "Tempo oficial: 20 + 16 minutos (dá para encurtar)",
        fala: "A duração oficial é de vinte minutos no primeiro tempo e dezesseis no segundo. Se o seu campeonato for mais curto, é só diminuir: as fases do jogo se ajustam sozinhas.",
        acao: async (a, page) => {
          await a.destacar(page.getByText("Duração da partida"), 3000);
          await a.sleep(3200);
          await a.destacar(page.locator("fieldset").first(), 5000);
        },
      },
      {
        etiqueta: "Passo 2 · Sorteio",
        legenda: "Liga com 1 grupo: 7 avançam aos playoffs",
        fala: "Aqui o campeonato já está criado, com oito equipes, e o sorteio foi feito com um grupo só, para todos jogarem contra todos. Sete avançam aos playoffs, como na Kings League Brasil.",
        acao: async (a, page) => {
          await page.goto(BASE + admin);
          await a.espera();
          await a.rolar(500, 16);
          await a.sleep(600);
          await a.destacar(page.locator("table").first(), 6000).catch(() => {});
        },
      },
      {
        etiqueta: "Passo 3 · A súmula",
        legenda: "As fases do jogo, com os minutos do seu campeonato",
        fala: "Agora a súmula de uma partida. No topo fica o placar, que é calculado sozinho. E aqui estão as fases do jogo: escalonado, cartas secretas, gols em dobro, dado e, no fim, matchball ou shootouts.",
        acao: async (a, page) => {
          await page.goto(BASE + sumula);
          await a.espera();
          await a.destacar(page.getByText("Placar pela súmula"), 3000);
          await a.sleep(3000);
          await a.clicar(page.getByText(/Fases do jogo/), { depois: 800 });
          await a.destacar(page.locator("details").first(), 6000);
        },
      },
      {
        etiqueta: "Passo 3 · Gol em dobro",
        legenda: "Do minuto 17 ao 20, o gol vale 2",
        fala: "Vamos lançar um gol aos dezoito minutos. Veja que o sistema já marca como gol em dobro, porque do minuto dezessete ao vinte todo gol vale dois.",
        acao: async (a, page) => {
          const f = form(page, "select[name=kind]");
          await f.locator("select[name=teamId]").selectOption(casa.id);
          await f.locator("select[name=playerId]").selectOption(casa.players[3].id);
          await a.digitar(f.locator("input[name=minute]"), "18", { atraso: 120 });
          await a.destacar(f.locator("select[name=kind]"), 2500);
          await a.sleep(2600);
          await a.clicar(f.getByRole("button", { name: "Adicionar gol" }), { depois: 1500 });
          await page.locator("li span", { hasText: "Gol em dobro" }).first().waitFor({ timeout: 30000 });
          await a.destacar(page.getByText("Placar pela súmula"), 2500);
        },
      },
      {
        etiqueta: "Passo 4 · Carta secreta",
        legenda: "Cada time usa a sua carta uma vez",
        fala: "Cada time tem uma carta secreta, que só vale do minuto cinco ao dezessete e do vinte e três ao trinta e seis. Aqui, o adversário usou a Suspensão: um jogador nosso fica quatro minutos fora. O sistema mostra o que cada carta faz.",
        acao: async (a, page) => {
          const f = form(page, "select[name=card]");
          await f.locator("select[name=teamId]").selectOption(fora.id);
          await a.mover(f.locator("select[name=card]"));
          await f.locator("select[name=card]").selectOption("SUSPENSAO");
          await a.sleep(600);
          await f.locator("select[name=playerId]").selectOption(casa.players[2].id);
          await a.digitar(f.locator("input[name=minute]"), "10", { atraso: 120 });
          await a.destacar(f.locator("p").first(), 3500);
          await a.sleep(3600);
          await a.clicar(f.getByRole("button", { name: "Usar carta" }), { depois: 1500 });
          await page.getByText(/Suspensão: .* fora por 4 minutos/).waitFor({ timeout: 30000 });
        },
      },
      {
        etiqueta: "Passo 5 · Pênalti do presidente",
        legenda: "Pênalti do presidente e o dado",
        fala: "O pênalti do presidente também é lançado aqui, com o minuto e se foi gol. E no começo do segundo tempo, registre o resultado do dado: um contra um, dois contra dois ou três contra três.",
        acao: async (a, page) => {
          const p = page.locator("form", { has: page.getByRole("button", { name: "Registrar pênalti" }) });
          await p.locator("select[name=teamId]").selectOption(fora.id);
          await a.digitar(p.locator("input[name=minute]"), "25", { atraso: 120 });
          await a.clicar(p.getByRole("button", { name: "Registrar pênalti" }), { depois: 1500 });
          await page.getByText(/Pênalti do presidente \(/).waitFor({ timeout: 30000 });
          const d = form(page, "select[name=result]");
          await a.mover(d.locator("select[name=result]"));
          await d.locator("select[name=result]").selectOption("2");
          await a.clicar(d.getByRole("button", { name: "Registrar dado" }), { depois: 1500 });
          await page.getByText(/Dado: 2x2/).waitFor({ timeout: 30000 });
        },
      },
      {
        etiqueta: "Passo 6 · Linha do tempo",
        legenda: "Tudo fica na linha do tempo da partida",
        fala: "Mais um gol, agora normal, e o jogo empata. Tudo o que foi lançado aparece na linha do tempo, em ordem, e o público vê a mesma coisa no site do campeonato.",
        acao: async (a, page) => {
          const f = form(page, "select[name=kind]");
          await f.locator("select[name=teamId]").selectOption(fora.id);
          await f.locator("select[name=playerId]").selectOption(fora.players[5].id);
          await a.digitar(f.locator("input[name=minute]"), "31", { atraso: 120 });
          await a.clicar(f.getByRole("button", { name: "Adicionar gol" }), { depois: 1800 });
          await page.getByRole("heading", { name: "Linha do tempo" }).scrollIntoViewIfNeeded();
          await a.sleep(800);
          await a.destacar(page.locator("ol").last(), 6500);
        },
      },
      {
        etiqueta: "Passo 7 · Shootouts",
        legenda: "Na Kings League não existe empate",
        fala: "Na Kings League não existe empate. Se o jogo terminar igual, a vitória sai nos shootouts. Informe o resultado e clique em Encerrar partida.",
        acao: async (a, page) => {
          const f = form(page, "input[name=homeShootouts]");
          await a.digitar(f.locator("input[name=homeShootouts]"), "3", { atraso: 150 });
          await a.digitar(f.locator("input[name=awayShootouts]"), "1", { atraso: 150 });
          await a.clicar(f.getByRole("button", { name: "Encerrar partida" }), { depois: 1500 });
          await page.getByText(/nos shootouts\)/).first().waitFor({ timeout: 30000 });
          await page.mouse.wheel(0, -3000);
          await a.sleep(800);
          await a.destacar(page.getByText(/nos shootouts\)/).first(), 3500);
        },
      },
      {
        etiqueta: "Passo 8 · Súmula impressa",
        legenda: "Súmula em branco para a beira do campo",
        fala: "Prefere anotar no papel durante o jogo? Clique em Imprimir súmula em branco. Ela já vem com as equipes, os jogadores, as fases e os quadros das cartas, do dado e dos shootouts.",
        acao: async (a, page) => {
          await page.goto(BASE + sumula);
          await a.espera();
          await a.clicar(page.getByRole("link", { name: "Imprimir súmula em branco" }), { depois: 1500 });
          await a.espera();
          await a.sleep(1500);
          await a.rolar(700, 20);
          await a.sleep(2500);
        },
      },
      {
        etiqueta: "Passo 9 · Classificação",
        legenda: "Vitória 3 · shootouts 2 e 1 · derrota 0",
        fala: "Na classificação, a vitória no tempo vale três pontos. Nos shootouts, quem vence ganha dois e quem perde ganha um. As colunas V S e D S mostram as vitórias e derrotas nos shootouts.",
        acao: async (a, page) => {
          await encerrarLiga(torneio.id, jogo.id);
          await page.goto(BASE + admin);
          await a.espera();
          const tabela = page.locator("table", { hasText: "VS" }).first();
          await a.destacar(tabela, 8000);
          await a.sleep(8200);
        },
      },
      {
        etiqueta: "Passo 10 · Playoffs",
        legenda: "O 1º vai direto à semifinal",
        fala: "Com a liga encerrada, clique em Gerar eliminatória. Os sete melhores vão aos playoffs: o primeiro colocado vai direto à semifinal, e nas quartas jogam o segundo contra o sétimo, o terceiro contra o sexto e o quarto contra o quinto.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("button", { name: "Gerar eliminatória a partir da classificação" }), { depois: 2500 });
          await a.espera();
          const chave = page.getByRole("heading", { name: "Chave principal" });
          await chave.waitFor({ timeout: 30000 });
          const alvo = await chave.boundingBox();
          await a.rolar(Math.max(0, (alvo?.y ?? 0) - 90), 26);
          await a.sleep(1200);
          await a.destacar(chave.locator(".."), 9000);
          await a.sleep(9000);
        },
      },
      {
        etiqueta: "Passo 11 · Site do campeonato",
        legenda: "As regras ficam explicadas para o público",
        fala: "E no site público do campeonato, o quadro Como funciona a Kings League explica as regras, com os minutos e a pontuação do seu campeonato.",
        acao: async (a, page) => {
          await page.goto(BASE + `/torneios/${SLUG}`);
          await a.espera();
          await a.clicar(page.getByText("Como funciona a Kings League"), { depois: 1000 });
          await a.destacar(page.locator("details").first(), 8000);
          await a.rolar(400, 14);
          await a.sleep(3000);
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
