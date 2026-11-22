/** Vídeo 1 — criar a conta e conhecer o painel. */
const { gravar } = require("./lib.cjs");
const { DEMO, limpar, prisma } = require("./demo.cjs");

(async () => {
  await limpar(); // começa sem o organizador de demonstração: ele é criado na câmera
  const saida = await gravar({
    nome: "01-criando-a-conta",
    etiqueta: "Vídeo 1 de 5 · Primeiros passos",
    titulo: "Criando a sua <span>conta</span>",
    subtitulo: "Leva menos de um minuto e não precisa de cartão",
    abertura:
      "Olá! Bem-vindo ao Sistema de Disputa. Neste primeiro vídeo você vai aprender a criar a sua conta e a conhecer o painel. É rápido, e você não precisa de cartão de crédito.",
    encerramento: "Pronto! Sua conta está criada. No próximo vídeo, vamos criar o seu primeiro campeonato. Até lá!",
    proximo: "Criando o seu primeiro campeonato",
    passos: [
      {
        etiqueta: "Passo 1 · Começar",
        legenda: "Clique em “Criar conta grátis”",
        fala: "Esta é a página inicial do sistema. Para começar, clique no botão Criar conta grátis, aqui em cima.",
        acao: async (a, page) => {
          await a.destacar(page.getByRole("link", { name: "Criar conta grátis" }).first(), 2500);
          await a.sleep(900);
          await a.clicar(page.getByRole("link", { name: "Criar conta grátis" }).first(), { depois: 1500 });
          await a.espera();
        },
      },
      {
        etiqueta: "Passo 2 · Seus dados",
        legenda: "Digite o seu nome",
        fala: "Primeiro, digite o seu nome.",
        acao: async (a, page) => {
          await a.digitar(page.getByLabel("Nome"), DEMO.nome, { atraso: 90 });
        },
      },
      {
        etiqueta: "Passo 2 · Seus dados",
        legenda: "Digite o seu e-mail",
        fala: "Agora o seu e-mail. É com ele que você vai entrar no sistema sempre que precisar.",
        acao: async (a, page) => {
          await a.digitar(page.getByLabel("E-mail"), DEMO.email, { atraso: 70 });
        },
      },
      {
        etiqueta: "Passo 2 · Seus dados",
        legenda: "Escolha uma senha (mínimo de 6 caracteres)",
        fala: "E escolha uma senha, com pelo menos seis caracteres. Anote em um lugar seguro, e não use a mesma senha de outros sites.",
        acao: async (a, page) => {
          await a.digitar(page.getByLabel("Senha"), DEMO.senha, { atraso: 90 });
        },
      },
      {
        etiqueta: "Passo 3 · Finalizar",
        legenda: "Clique em “Criar conta”",
        fala: "Repare neste aviso: ao criar a conta, você concorda com os Termos de Uso e com a Política de Privacidade. Agora é só clicar em Criar conta.",
        acao: async (a, page) => {
          await a.destacar(page.getByText("Ao criar a conta, você concorda"), 3500);
          await a.sleep(2800);
          await a.clicar(page.getByRole("button", { name: "Criar conta" }), { depois: 1500 });
          await page.waitForURL("**/admin", { timeout: 30000 });
          await a.espera();
        },
      },
      {
        etiqueta: "Passo 4 · Conhecendo o painel",
        legenda: "Este é o seu painel de organizador",
        fala: "Pronto! Esta é a sua área de organizador. No alto ficam os menus: Torneios, onde aparecem os seus campeonatos, e Planos.",
        acao: async (a, page) => {
          await a.destacar(page.getByRole("link", { name: "Torneios" }).first(), 2200);
          await a.sleep(2400);
          await a.destacar(page.getByRole("link", { name: "Planos" }).first(), 2200);
        },
      },
      {
        etiqueta: "Passo 4 · Conhecendo o painel",
        legenda: "O primeiro campeonato é grátis",
        fala: "Aqui aparece o seu plano. No teste grátis, você pode criar o seu primeiro campeonato sem pagar nada.",
        acao: async (a, page) => {
          await a.destacar(page.getByText("Plano atual").first(), 3500);
        },
      },
      {
        etiqueta: "Passo 4 · Conhecendo o painel",
        legenda: "Clique no seu nome para trocar a senha",
        fala: "E, quando quiser trocar a senha, clique no seu nome, no canto direito, e vá em Alterar senha.",
        acao: async (a, page) => {
          await a.clicar(page.locator('a[href="/admin/conta"]'), { depois: 1200 });
          await a.espera();
          await a.destacar(page.getByRole("heading", { name: "Alterar senha" }), 2500);
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
