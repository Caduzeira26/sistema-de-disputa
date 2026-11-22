/** Vídeo 3 — receber as inscrições, aprovar as equipes e divulgar com o cartaz. */
const { gravar, BASE } = require("./lib.cjs");
const { DEMO, preparar, prisma } = require("./demo.cjs");

(async () => {
  // campeonato com inscrições abertas e 3 equipes já pendentes; a quarta se inscreve na câmera
  const { estado, torneio } = await preparar({ torneio: true, status: "REGISTRATION_OPEN", equipes: ["Leões EC", "Tubarões", "Falcões"], aprovadas: false });
  const admin = `/admin/torneios/${torneio.id}`;
  const saida = await gravar({
    nome: "03-inscricoes",
    estado,
    inicio: admin,
    etiqueta: "Vídeo 3 de 5 · Inscrições",
    titulo: "Recebendo as <span>inscrições</span>",
    subtitulo: "Como as equipes se inscrevem e como você aprova",
    abertura:
      "Agora que o campeonato está com as inscrições abertas, vamos ver como as equipes se inscrevem, e como você aprova cada uma delas.",
    encerramento: "Com as equipes aprovadas, está na hora do sorteio. É o assunto do próximo vídeo.",
    proximo: "Sorteio e chaveamento",
    passos: [
      {
        etiqueta: "Passo 1 · O link da inscrição",
        legenda: "Mande este link para as equipes",
        fala: "Na página do torneio, este é o link da ficha de inscrição. Mande esse link para o responsável de cada equipe, por WhatsApp, por exemplo.",
        acao: async (a, page) => {
          await a.destacar(page.getByText("Ficha de inscrição (compartilhe").first(), 5000);
        },
      },
      {
        etiqueta: "Passo 1 · O link da inscrição",
        legenda: "Assim a equipe vê a ficha",
        fala: "Quando a equipe abre o link, ela cai nesta ficha. Repare: se você cadastrou uma chave PIX, ela aparece aqui, com um QR Code, para a equipe pagar a inscrição.",
        acao: async (a, page) => {
          await page.goto(BASE + `/torneios/${DEMO.slug}/inscricao`);
          await a.espera();
          await a.destacar(page.getByText("Pagamento da inscrição por PIX").first(), 5500);
        },
      },
      {
        etiqueta: "Passo 2 · A equipe preenche",
        legenda: "Nome da equipe e do responsável",
        fala: "A equipe preenche o nome, o nome do responsável e um telefone para contato.",
        acao: async (a, page) => {
          await a.digitar(page.getByLabel("Nome da equipe"), "Águias FC", { atraso: 85 });
          await a.digitar(page.getByLabel("Responsável/técnico"), "Carlos Lima", { atraso: 70 });
          await a.digitar(page.getByLabel("Telefone de contato"), "(43) 99999-0000", { atraso: 60 });
        },
      },
      {
        etiqueta: "Passo 2 · A equipe preenche",
        legenda: "Cadastre os jogadores (mínimo de 5 no futsal)",
        fala: "Depois, cadastra os jogadores. Cada esporte tem um mínimo de atletas: no futsal, são cinco. Enquanto faltar jogador, o botão de enviar fica bloqueado.",
        acao: async (a, page) => {
          const nomes = page.locator('input[placeholder="Nome"]');
          await a.digitar(nomes.nth(0), "Pedro Alves", { atraso: 70 });
          const extras = ["Lucas Rocha", "Mateus Dias", "João Prado", "Rafael Costa"];
          for (let i = 0; i < extras.length; i++) {
            await a.clicar(page.getByRole("button", { name: "+ Adicionar jogador" }), { depois: 400 });
            await nomes.nth(i + 1).fill(extras[i]);
          }
          await a.destacar(page.getByText("Mínimo de 5 jogadores").first(), 2500).catch(() => {});
        },
      },
      {
        etiqueta: "Passo 2 · A equipe preenche",
        legenda: "Clique em “Enviar inscrição”",
        fala: "Com todos os jogadores cadastrados, é só clicar em Enviar inscrição. A equipe recebe a confirmação na hora.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("button", { name: "Enviar inscrição" }), { depois: 800 });
          try {
            await page.getByText("Inscrição enviada com sucesso!").waitFor({ timeout: 25000 });
          } catch (e) {
            console.log("TELA APÓS O ENVIO:", (await page.locator("main").innerText()).split("\n").join(" | ").slice(0, 700));
            await page.screenshot({ path: "videos/tmp/falha-inscricao.png" });
            throw e;
          }
          await a.destacar(page.getByText("Inscrição enviada com sucesso!"), 3500);
        },
      },
      {
        etiqueta: "Passo 3 · Você aprova",
        legenda: "A equipe aparece como “Pendente”",
        fala: "Agora, de volta ao painel do torneio. A equipe aparece na lista como pendente, esperando a sua aprovação. Só equipes aprovadas entram no sorteio.",
        acao: async (a, page) => {
          await page.goto(BASE + admin);
          await a.espera();
          await a.destacar(page.getByRole("heading", { name: /Equipes inscritas/ }), 1500);
          await a.destacar(page.getByText("aguardando aprovação").first(), 4500);
        },
      },
      {
        etiqueta: "Passo 3 · Você aprova",
        legenda: "Clique em “Aprovar todas as pendentes”",
        fala: "Você pode aprovar uma por uma, ou clicar em Aprovar todas as pendentes. Quando aprovada, a equipe fica com o selo verde.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("button", { name: /Aprovar todas as pendentes/ }).first(), { depois: 800 });
          await page.getByText("Aprovada").first().waitFor({ timeout: 60000 });
          await a.espera();
          await a.destacar(page.getByText("Aprovada").first(), 3500);
        },
      },
      {
        etiqueta: "Passo 4 · Divulgação",
        legenda: "Cartaz com QR Code, pronto para imprimir",
        fala: "Para divulgar, abra o Cartaz com QR Code. O sistema monta uma folha pronta para imprimir, com o nome do campeonato e um QR Code que leva direto à ficha de inscrição.",
        acao: async (a, page) => {
          await page.goto(BASE + `${admin}/qrcode`);
          await a.espera();
          await a.destacar(page.locator("section").first(), 6000);
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
