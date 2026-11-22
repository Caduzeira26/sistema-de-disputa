/** Dados de demonstração dos vídeos: um organizador fictício e um campeonato de exemplo. */
const path = require("node:path");
const fs = require("node:fs");
const { PrismaClient } = require(path.join(__dirname, "..", "..", "node_modules", "@prisma", "client"));
const bcrypt = require(path.join(__dirname, "..", "..", "node_modules", "bcryptjs"));
const { chromium } = require(process.env.PLAYWRIGHT || "C:/Users/edu-m/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core");
const { BASE, CHROME, TMP } = require("./lib.cjs");

const prisma = new PrismaClient();

const DEMO = {
  nome: "Maria Souza",
  email: "maria.souza@exemplo.com",
  senha: "Demo@2026",
  torneio: "Copa Digita Money de Futsal",
  slug: "copa-digita-money-de-futsal",
  equipes: ["Águias FC", "Leões EC", "Tubarões", "Falcões"],
};

async function usuario() {
  return prisma.user.findUnique({ where: { email: DEMO.email } });
}

/** Apaga o organizador de demonstração e tudo o que ele criou (por id, nunca por padrão de nome). */
async function limpar() {
  const u = await usuario();
  if (!u) return;
  const torneios = await prisma.tournament.findMany({ where: { organizerId: u.id }, select: { id: true } });
  const ids = torneios.map((t) => t.id);
  const jogadores = await prisma.player.findMany({ where: { team: { tournamentId: { in: ids } } }, select: { athleteId: true } });
  const atletas = [...new Set(jogadores.map((j) => j.athleteId))];
  await prisma.tournament.deleteMany({ where: { id: { in: ids } } });
  await prisma.athlete.deleteMany({ where: { id: { in: atletas } } });
  const subs = await prisma.subscription.findMany({ where: { userId: u.id }, select: { id: true } });
  await prisma.gatewayPayment.deleteMany({ where: { subscriptionId: { in: subs.map((s) => s.id) } } });
  await prisma.pixTransaction.deleteMany({ where: { subscriptionId: { in: subs.map((s) => s.id) } } });
  await prisma.subscription.deleteMany({ where: { userId: u.id } });
  await prisma.user.delete({ where: { id: u.id } });
}

async function criarUsuario() {
  return prisma.user.create({ data: { name: DEMO.nome, email: DEMO.email, passwordHash: await bcrypt.hash(DEMO.senha, 10) } });
}

/** Cria o campeonato de exemplo com equipes já inscritas (1 jogador por vaga extra, no mínimo exigido pelo esporte). */
async function criarTorneio({ status = "REGISTRATION_OPEN", equipes = DEMO.equipes, aprovadas = false, jogadoresPorEquipe = 5, pix = true } = {}) {
  const u = (await usuario()) || (await criarUsuario());
  const t = await prisma.tournament.create({
    data: {
      name: DEMO.torneio,
      slug: DEMO.slug,
      description: "Campeonato de exemplo para os vídeos de ajuda.",
      format: "SINGLE_ELIMINATION",
      sportType: "FUTSAL",
      status,
      organizerId: u.id,
      startDate: new Date("2026-12-05T12:00:00Z"),
      endDate: new Date("2026-12-06T12:00:00Z"),
      manualPixKey: pix ? "pagamentos@exemplo.com" : null,
      manualPixHolder: pix ? "Maria Souza" : null,
      manualPixAmountCents: pix ? 3000 : null,
    },
  });
  for (const nome of equipes) {
    const players = [];
    for (let i = 1; i <= jogadoresPorEquipe; i++) {
      const a = await prisma.athlete.create({ data: { name: `${nome} — Jogador ${i}` } });
      players.push({ athleteId: a.id, name: `${nome} — Jogador ${i}`, shirtNumber: i });
    }
    await prisma.team.create({
      data: { tournamentId: t.id, name: nome, managerName: "Responsável " + nome, status: aprovadas ? "APPROVED" : "PENDING", players: { create: players } },
    });
  }
  return t;
}

/** Entra como o organizador de demonstração (fora de câmera) e guarda a sessão para as gravações. */
async function salvarEstado() {
  fs.mkdirSync(TMP, { recursive: true });
  const arquivo = path.join(TMP, "estado-demo.json");
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 576 }, locale: "pt-BR" });
  const page = await ctx.newPage();
  await page.goto(BASE + "/admin/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("E-mail").fill(DEMO.email);
  await page.getByLabel("Senha").fill(DEMO.senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/admin", { timeout: 30000 });
  await ctx.storageState({ path: arquivo });
  await browser.close();
  return arquivo;
}

/** Faz o sorteio e gera o chaveamento (fora de câmera) para os vídeos que começam com a chave pronta. */
async function semearChaveamento(estado, torneioId) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 576 }, locale: 'pt-BR', storageState: estado });
  const page = await ctx.newPage();
  await page.goto(BASE + '/admin/torneios/' + torneioId + '/sorteio');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Iniciar o sorteio' }).click();
  await page.getByRole('button', { name: 'Revelar todas' }).waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: 'Revelar todas' }).click();
  await page.getByRole('button', { name: 'Confirmar sorteio e gerar chaveamento' }).waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: 'Confirmar sorteio e gerar chaveamento' }).click();
  await page.getByText('Sorteio concluído').waitFor({ timeout: 60000 });
  await browser.close();
}

/** Deixa o cenário pronto: organizador de demonstração (sem conta, se quiser que o vídeo a crie), campeonato e sessão. */
async function preparar({ torneio = false, ...opcoesTorneio } = {}) {
  await limpar();
  await criarUsuario();
  const estado = await salvarEstado();
  const t = torneio ? await criarTorneio(opcoesTorneio) : null;
  return { estado, torneio: t };
}

module.exports = { DEMO, prisma, usuario, limpar, criarUsuario, criarTorneio, salvarEstado, semearChaveamento, preparar };
