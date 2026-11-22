/**
 * Vídeo 6 — os planos e como pagar.
 *
 * Precisa do servidor de gravação com o Asaas de mentira (veja LEIA-ME.md): o fluxo de compra
 * cria uma cobrança de teste e o roteiro simula o pagamento. Ninguém é cobrado de verdade.
 */
const { gravar, BASE } = require("./lib.cjs");
const { DEMO, preparar, prisma } = require("./demo.cjs");

const ASAAS_FALSO = process.env.ASAAS_FALSO || "http://localhost:4010";

(async () => {
  await preparar(); // organizador de demonstração criado (o vídeo faz o login na câmera)
  // O sistema pede CPF/CNPJ na primeira compra; deixamos um valor fictício já guardado
  // para o vídeo não precisar digitar documento de ninguém.
  await prisma.user.update({ where: { email: DEMO.email }, data: { cpfCnpj: "00000000000" } });

  const cartao = (page, titulo) => page.locator("div.rounded-xl", { has: page.getByRole("heading", { name: titulo, exact: true }) }).first();

  const saida = await gravar({
    nome: "06-planos-e-pagamento",
    inicio: "/planos",
    largura: 1280, // mostra os 4 planos lado a lado
    etiqueta: "Vídeo extra · Planos e pagamento",
    titulo: "Os <span>planos</span> e como pagar",
    subtitulo: "Do pacote grátis ao Corporativo",
    abertura:
      "Neste vídeo você vai conhecer os planos do Sistema de Disputa e ver, passo a passo, como funciona o pagamento.",
    encerramento: "Agora você já conhece os planos e sabe como pagar. Bom campeonato!",
    etiquetaFim: "Fim",
    proximo: "Obrigado por assistir",
    passos: [
      {
        etiqueta: "Passo 1 · Os planos",
        legenda: "Comece pelo pacote Grátis",
        fala: "Esta é a página de planos, e qualquer pessoa pode abrir, sem se cadastrar. O primeiro é o pacote Grátis. Ele inclui um campeonato completo, com até dezesseis equipes, em futebol de campo ou futsal, com inscrição online, sorteio, chaveamento e site público. Sem cartão, e sem prazo para acabar.",
        acao: async (a, page) => {
          await a.destacar(cartao(page, "Grátis"), 6500);
          await a.sleep(7000);
          await a.destacar(page.getByRole("link", { name: "Criar conta grátis" }).last(), 3500).catch(() => {});
        },
      },
      {
        etiqueta: "Passo 1 · Os planos",
        legenda: "Start, Pro e Liga",
        fala: "Quando precisar de mais, há três planos pagos. O Start custa vinte e nove reais e noventa centavos por mês, para até dezesseis equipes, em futebol e futsal. Ele também pode ser comprado avulso, por vinte e cinco reais, para um campeonato só. O Pro custa cento e quarenta e sete reais por mês, com equipes e campeonatos ilimitados, todas as modalidades e inscrição paga por PIX. E o Liga custa cento e noventa e sete reais por mês, e inclui ainda o cadastro de atletas entre campeonatos e suporte prioritário.",
        acao: async (a, page) => {
          await a.destacar(cartao(page, "Start"), 8500);
          await a.sleep(9200);
          await a.destacar(cartao(page, "Pro"), 6500);
          await a.sleep(7200);
          await a.destacar(cartao(page, "Liga"), 6500);
        },
      },
      {
        etiqueta: "Passo 2 · Corporativo",
        legenda: "Corporativo: o sistema completo, com o seu domínio",
        fala: "E para organizações que querem o sistema só delas, existe o plano Corporativo. É o sistema completo, instalado pela nossa equipe, com o site dos campeonatos no domínio da sua organização, e tudo o que os outros planos têm. A instalação custa mil e duzentos reais, uma única vez, mais duzentos reais por mês. Esse plano é combinado direto com a nossa equipe, pelo WhatsApp.",
        acao: async (a, page) => {
          const faixa = page.locator("div.rounded-2xl", { has: page.getByRole("heading", { name: "Corporativo", exact: true }) }).first();
          await faixa.scrollIntoViewIfNeeded();
          await a.sleep(800);
          await a.destacar(faixa, 9500);
          await a.sleep(10500);
          await a.destacar(page.getByRole("link", { name: "Falar com a equipe no WhatsApp" }), 4500);
        },
      },
      {
        etiqueta: "Passo 3 · Assinar",
        legenda: "Entre na sua conta",
        fala: "Para assinar um plano pago, você precisa estar com a sua conta. Entre com o seu e-mail e a sua senha.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("link", { name: "Entrar" }).first(), { depois: 1200 });
          await a.espera();
          await a.digitar(page.getByLabel("E-mail"), DEMO.email, { atraso: 55 });
          await a.digitar(page.getByLabel("Senha"), DEMO.senha, { atraso: 70 });
          await a.clicar(page.getByRole("button", { name: "Entrar" }), { depois: 1200 });
          await page.waitForURL("**/admin", { timeout: 60000 });
          await a.espera();
        },
      },
      {
        etiqueta: "Passo 3 · Assinar",
        legenda: "Clique em “Assinar agora” no plano escolhido",
        fala: "Volte aos planos e clique em Assinar agora, no plano que quiser. Na primeira compra, o sistema também pede o seu CPF ou CNPJ, para emitir a cobrança. Isso é pedido uma vez só. Vamos escolher o Pro.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("link", { name: "Planos" }).first(), { depois: 1200 });
          await a.espera();
          const assinar = page.getByRole("button", { name: /Assinar agora.*147,00/ });
          await a.mover(assinar);
          await a.destacar(assinar, 5500);
          await a.sleep(6000);
          await a.clicar(assinar, { depois: 1500 });
          await page.waitForURL(/\/admin\/assinatura\/cobranca\//, { timeout: 60000 });
          await a.espera();
        },
      },
      {
        etiqueta: "Passo 4 · Pagar",
        legenda: "Escolha como pagar: PIX, boleto, crédito ou débito",
        fala: "Pronto! A cobrança foi gerada. Ao clicar em Pagar agora, abre uma página segura de pagamento, onde você escolhe como pagar: PIX, boleto, cartão de crédito ou cartão de débito. Os dados do cartão são digitados só nessa página segura, e nunca passam pelo nosso sistema.",
        acao: async (a, page) => {
          await a.destacar(page.getByText("Aguardando o pagamento").first(), 3500);
          await a.sleep(3800);
          await a.destacar(page.getByRole("link", { name: "Pagar agora" }), 6500);
        },
      },
      {
        etiqueta: "Passo 4 · Pagar",
        legenda: "PIX e cartão liberam na hora. Boleto, após compensar.",
        fala: "Veja quando o plano é liberado. No PIX e no cartão, assim que o pagamento é aprovado. No boleto, só depois que o valor for compensado, em geral de um a dois dias úteis depois que você paga. Enquanto isso, a cobrança fica aguardando.",
        acao: async (a, page) => {
          await a.destacar(page.locator("ul").first(), 9500);
        },
      },
      {
        etiqueta: "Passo 5 · Confirmado",
        legenda: "Pagamento confirmado: o plano é ativado sozinho",
        fala: "Quando o pagamento é confirmado, esta página muda sozinha, sem você precisar recarregar. E o seu plano já está ativo.",
        acao: async (a, page) => {
          const lista = await fetch(`${ASAAS_FALSO}/__list`).then((r) => r.json());
          const cobranca = lista[lista.length - 1];
          await a.sleep(2500);
          await fetch(`${ASAAS_FALSO}/__set`, {
            method: "POST",
            body: JSON.stringify({ id: cobranca.id, patch: { status: "RECEIVED", billingType: "PIX" } }),
          });
          await page.getByText("Pagamento confirmado!").waitFor({ timeout: 45000 });
          await a.destacar(page.getByText("Pagamento confirmado!"), 5000);
        },
      },
      {
        etiqueta: "Passo 6 · Depois da compra",
        legenda: "Renovação mensal e 7 dias de garantia",
        fala: "As assinaturas mensais são renovadas manualmente: todo mês você paga uma nova cobrança. E, nas compras pela internet, você tem sete dias de garantia para pedir reembolso. No painel, você sempre vê o seu plano atual.",
        acao: async (a, page) => {
          await a.clicar(page.getByRole("link", { name: "Ir para o painel" }), { depois: 1200 });
          await a.espera();
          await a.destacar(page.getByText("Plano atual").first(), 7000);
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
