/** Vídeo 2 — criar o primeiro campeonato. */
const { gravar } = require("./lib.cjs");
const { DEMO, preparar, prisma } = require("./demo.cjs");

(async () => {
  const { estado } = await preparar(); // organizador já cadastrado, sem campeonatos
  const saida = await gravar({
    nome: "02-primeiro-campeonato",
    estado,
    inicio: "/admin",
    etiqueta: "Vídeo 2 de 5 · Seu campeonato",
    titulo: "Criando o seu primeiro <span>campeonato</span>",
    subtitulo: "Do zero, passo a passo",
    abertura:
      "Neste vídeo você vai criar o seu primeiro campeonato, do zero. Vamos usar como exemplo uma copa de futsal de uma escola.",
    encerramento: "Seu campeonato está criado e com as inscrições abertas. No próximo vídeo, vamos receber as inscrições das equipes.",
    proximo: "Recebendo as inscrições das equipes",
    passos: [
      {
        etiqueta: "Passo 1 · Novo torneio",
        legenda: "Clique em “Novo torneio”",
        fala: "Na tela inicial do painel, clique no botão Novo torneio.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("link", { name: "Novo torneio" }).first(), { depois: 1500 });
          await a.espera();
        },
      },
      {
        etiqueta: "Passo 2 · Preencher",
        legenda: "Dê um nome ao campeonato",
        fala: "Primeiro, escreva o nome do campeonato. Esse nome aparece para todo mundo: nos cartazes e no site público.",
        acao: async (a, page) => {
          await a.digitar(page.getByLabel("Nome do torneio"), DEMO.torneio, { atraso: 70 });
        },
      },
      {
        etiqueta: "Passo 2 · Preencher",
        legenda: "A descrição é opcional",
        fala: "Se quiser, escreva uma descrição curta. Este campo é opcional.",
        acao: async (a, page) => {
          await a.digitar(page.getByLabel("Descrição (opcional)"), "Campeonato de futsal do colégio", { atraso: 55 });
        },
      },
      {
        etiqueta: "Passo 2 · Preencher",
        legenda: "Escolha a modalidade",
        fala: "Escolha a modalidade. O sistema tem futebol, futsal, vôlei, basquete, handebol, tênis de mesa e até jogos eletrônicos, como FIFA e Free Fire. Aqui vamos usar futsal.",
        acao: async (a, page) => {
          const campo = page.getByLabel("Modalidade");
          await a.mover(campo);
          await a.destacar(campo, 3500);
          await a.sleep(1200);
          await campo.selectOption({ label: "Futsal" });
        },
      },
      {
        etiqueta: "Passo 2 · Preencher",
        legenda: "Escolha o formato de disputa",
        fala: "Depois, o formato. Eliminatória simples é o mata-mata: quem perde, está fora. Existem também a eliminatória dupla, com repescagem, e a fase de grupos. Vamos de mata-mata.",
        acao: async (a, page) => {
          const campo = page.getByLabel("Formato de disputa");
          await a.mover(campo);
          await a.destacar(campo, 3500);
          await a.sleep(1500);
          await campo.selectOption({ label: "Eliminatória simples (mata-mata)" });
        },
      },
      {
        etiqueta: "Passo 2 · Preencher",
        legenda: "Informe as datas (opcional)",
        fala: "Você também pode informar as datas de início e de término. Isso é opcional.",
        acao: async (a, page) => {
          const inicio = page.getByLabel("Início (opcional)");
          await a.mover(inicio);
          await inicio.fill("2026-12-05");
          await a.sleep(600);
          const fim = page.getByLabel("Término (opcional)");
          await a.mover(fim);
          await fim.fill("2026-12-06");
        },
      },
      {
        etiqueta: "Passo 3 · Criar",
        legenda: "Clique em “Criar torneio”",
        fala: "Pronto! Agora é só clicar em Criar torneio.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("button", { name: "Criar torneio" }), { depois: 1500 });
          await page.waitForURL(/\/admin\/torneios\/[a-z0-9]{10,}$/, { timeout: 60000 });
          await a.espera();
        },
      },
      {
        etiqueta: "Passo 4 · Sua página do torneio",
        legenda: "Esta é a página de controle do campeonato",
        fala: "Esta é a página de controle do seu campeonato. Aqui em cima ficam o nome, a modalidade e as datas.",
        acao: async (a, page) => {
          await a.destacar(page.getByRole("heading", { name: DEMO.torneio }), 4000);
        },
      },
      {
        etiqueta: "Passo 4 · Sua página do torneio",
        legenda: "Link público e ficha de inscrição",
        fala: "O link público é o site do campeonato, que qualquer pessoa pode abrir. Já a ficha de inscrição é o link que você manda para as equipes se inscreverem.",
        acao: async (a, page) => {
          await a.destacar(page.getByText("Link público:").first(), 3500);
          await a.sleep(3600);
          await a.destacar(page.getByText("Ficha de inscrição (compartilhe").first(), 3500);
        },
      },
      {
        etiqueta: "Passo 5 · Abrir inscrições",
        legenda: "Mude para “Inscrições abertas” e clique em Atualizar",
        fala: "O campeonato nasce como rascunho. Para as equipes poderem se inscrever, mude a situação para Inscrições abertas e clique em Atualizar.",
        acao: async (a, page) => {
          const campo = page.locator("select[name=status]");
          await a.mover(campo);
          await a.destacar(campo, 2500);
          await a.sleep(1500);
          await campo.selectOption("REGISTRATION_OPEN");
          await a.sleep(800);
          await a.clicar(page.getByRole("button", { name: "Atualizar" }), { depois: 1500 });
          await a.espera();
          await a.destacar(page.getByText("Situação atual:").first(), 3000);
        },
      },
      {
        etiqueta: "Passo 6 · Mais opções",
        legenda: "Logo, nome, datas e chave PIX",
        fala: "Mais abaixo, você pode colocar a logo do campeonato, mudar o nome, ajustar as datas e cadastrar a sua chave PIX, para receber o pagamento das inscrições.",
        acao: async (a, page) => {
          await a.destacar(page.getByText("Logo do torneio").first(), 3000);
          await a.sleep(2800);
          await a.destacar(page.getByRole("heading", { name: "Nome do torneio" }), 2500);
          await a.sleep(2400);
          await a.destacar(page.getByRole("heading", { name: "Chave PIX para pagamento da inscrição" }), 3500);
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
