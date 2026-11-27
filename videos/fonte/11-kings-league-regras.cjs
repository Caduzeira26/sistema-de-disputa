/**
 * Vídeo 11 — Kings League: todas as regras, explicadas em slides.
 * Fonte das regras: kingsleague.pro/pt/como-se-joga (regras oficiais); pontuação e formato da
 * Kings League Brasil 2025.
 */
const { gravar, BASE } = require("./lib.cjs");
const { servirSlides, passosDeSlides } = require("./slides.cjs");

const T = "Kings League";
const slides = [
  {
    tag: T,
    titulo: "O que é a <span>Kings League</span>",
    sub: "Futebol 7 criado por Gerard Piqué, com jogos curtos e regras que mudam a partida a cada minuto.",
    itens: [
      { icone: "⚽", titulo: "Futebol 7", texto: "6 jogadores de linha + goleiro" },
      { icone: "👑", titulo: "Presidentes", texto: "Cada time tem um presidente, que pode até bater pênalti" },
      { icone: "🃏", titulo: "Cartas secretas", texto: "Viradas que o time guarda para a hora certa" },
      { icone: "⏱️", titulo: "Sem empate", texto: "Jogo igual termina nos shootouts" },
    ],
    legenda: "Futebol 7 com regras que mudam o jogo",
    fala: "A Kings League é um futebol sete criado pelo ex-jogador Gerard Piqué. Os jogos são curtos e cheios de viradas: cada time tem um presidente, cartas secretas para usar na hora certa, e nenhuma partida termina empatada.",
  },
  {
    tag: `${T} · O básico`,
    titulo: "Como é uma <span>partida</span>",
    grande: "20 + 16 min",
    itens: [
      { icone: "👥", titulo: "7 contra 7", texto: "6 na linha e 1 no gol" },
      { icone: "🔁", titulo: "Substituições ilimitadas", texto: "Entra e sai à vontade" },
      { icone: "⏱️", titulo: "Tempo corrido", texto: "O relógio só para em casos especiais" },
      { icone: "🚫", titulo: "Não existe empate", texto: "Se terminar igual, vai para os shootouts" },
    ],
    legenda: "Primeiro tempo de 20 e segundo de 16 minutos",
    fala: "A partida tem dois tempos: vinte minutos no primeiro e dezesseis no segundo, com o relógio correndo direto. São sete contra sete, seis na linha e um no gol, com substituições ilimitadas. E não existe empate.",
  },
  {
    tag: `${T} · Linha do tempo`,
    titulo: "O jogo <span>minuto a minuto</span>",
    linha: [
      { quando: "0'–5'", oque: "Escalonado: começa 1x1 e vai até 7x7" },
      { quando: "5'–17'", oque: "Cartas secretas e pênalti do presidente liberados" },
      { quando: "17'–20'", oque: "Gols em dobro: cada gol vale 2" },
      { quando: "20'–23'", oque: "Dado: 1x1, 2x2 ou 3x3" },
      { quando: "23'–36'", oque: "Cartas e pênalti do presidente de novo" },
      { quando: "36'", oque: "Empate vai para os shootouts; senão, modo matchball" },
    ],
    legenda: "Cada fase muda o jogo",
    fala: "O segredo da Kings League está na linha do tempo. Até o minuto cinco, o escalonado. Do cinco ao dezessete, cartas secretas e pênalti do presidente. Do dezessete ao vinte, gol vale dois. Do vinte ao vinte e três, o dado. Depois, cartas de novo até o trinta e seis, quando vêm os shootouts ou o matchball.",
  },
  {
    tag: `${T} · Escalonado`,
    titulo: "O início <span>escalonado</span>",
    sub: "A bola cai de uma gaiola e um jogador de cada lado corre para pegá-la.",
    linha: [
      { quando: "0'", oque: "1 contra 1, com os goleiros" },
      { quando: "1'", oque: "2 contra 2" },
      { quando: "2'", oque: "3 contra 3" },
      { quando: "3'", oque: "4 contra 4 e assim por diante" },
      { quando: "5'", oque: "7 contra 7: times completos" },
    ],
    legenda: "Começa 1x1 e entra um jogador por minuto",
    fala: "O jogo começa com um jogador de linha e o goleiro de cada time. A bola cai de uma gaiola e os dois correm para pegá-la. A cada minuto entra mais um jogador de cada lado, até os times ficarem completos, sete contra sete, no minuto cinco.",
  },
  {
    tag: `${T} · Cartas secretas`,
    titulo: "As <span>cartas secretas</span> (1)",
    sub: "Antes do jogo, cada técnico sorteia uma carta. Ela só pode ser usada de 5' a 17' e de 23' a 36'.",
    itens: [
      { icone: "✖️2", titulo: "Gol x2", texto: "Por 4 minutos, todo gol do time vale dois" },
      { icone: "⛔", titulo: "Suspensão", texto: "Um adversário (não o goleiro) fica 4 minutos fora" },
      { icone: "⭐", titulo: "Jogador estrela", texto: "O primeiro gol do escolhido vale dois; ele usa braçadeira" },
    ],
    colunas: 3,
    legenda: "Uma carta por time, sorteada antes do jogo",
    fala: "Antes do jogo, cada técnico sorteia uma carta secreta, que só vale do minuto cinco ao dezessete e do vinte e três ao trinta e seis. A carta Gol x2 faz todo gol do time valer dois por quatro minutos. A Suspensão tira um adversário de campo por quatro minutos, menos o goleiro. E o Jogador estrela faz o primeiro gol do escolhido valer dois.",
  },
  {
    tag: `${T} · Cartas secretas`,
    titulo: "As <span>cartas secretas</span> (2)",
    itens: [
      { icone: "🎯", titulo: "Shootout", texto: "Bola no meio-campo: 5 segundos para um 1x1 contra o goleiro" },
      { icone: "🥅", titulo: "Pênalti", texto: "Um pênalti normal para o time" },
      { icone: "🔄", titulo: "Pênalti inverso", texto: "O adversário bate: se marcar, não vale; se errar, o gol é seu" },
      { icone: "🃏", titulo: "Coringa", texto: "Vira qualquer outra carta ou rouba a carta do adversário" },
    ],
    legenda: "Shootout, pênalti, pênalti inverso e coringa",
    fala: "Tem mais. O Shootout dá um um contra um saindo do meio-campo, com cinco segundos para finalizar. O Pênalti é um pênalti normal. No Pênalti inverso, o adversário bate: se marcar, não vale nada, e se errar, o gol é do seu time. E o Coringa vira qualquer outra carta, ou rouba a carta do adversário.",
  },
  {
    tag: `${T} · Gol em dobro`,
    titulo: "Do 17' ao 20': <span>gol vale 2</span>",
    grande: "× 2",
    sub: "Uma bola de cor diferente entra em campo e todo gol vale dobrado até o intervalo, sem acréscimos.",
    legenda: "Fim do primeiro tempo: cada gol vale dois",
    fala: "No minuto dezessete entra em campo uma bola de cor diferente, e até o intervalo todo gol vale dois. Como não há acréscimos, os últimos segundos do primeiro tempo costumam ser os mais loucos do jogo.",
  },
  {
    tag: `${T} · O dado`,
    titulo: "O segundo tempo começa com o <span>dado</span>",
    sub: "Um dado gigante decide quantos jogadores ficam em campo do minuto 20 ao 23. Depois, todos voltam: 7 contra 7.",
    itens: [
      { icone: "🎲", titulo: "Logo da Kings League", texto: "1 contra 1, mais os goleiros" },
      { icone: "🎲", titulo: "Número 2", texto: "2 contra 2, mais os goleiros" },
      { icone: "🎲", titulo: "Número 3", texto: "3 contra 3, mais os goleiros" },
    ],
    colunas: 3,
    legenda: "Dado: 1x1, 2x2 ou 3x3 por três minutos",
    fala: "O segundo tempo começa com o lançamento de um dado gigante. Se sair o logo da Kings League, é um contra um. Se sair dois, dois contra dois. Se sair três, três contra três, sempre com os goleiros. Isso vale por três minutos, e depois os times voltam a ficar completos.",
  },
  {
    tag: `${T} · Pênalti do presidente`,
    titulo: "O <span>pênalti do presidente</span>",
    itens: [
      { icone: "👑", titulo: "Quem bate", texto: "O presidente do time, só se estiver presente" },
      { icone: "⏱️", titulo: "Quando", texto: "Antes do minuto 35:59, nas janelas das cartas" },
      { icone: "🚫", titulo: "Quando não pode", texto: "No escalonado, gol em dobro, dado e matchball" },
      { icone: "↩️", titulo: "Direito de resposta", texto: "O adversário pode responder com o seu pênalti ou um shootout" },
    ],
    legenda: "O presidente também pode decidir o jogo",
    fala: "O pênalti do presidente é batido pelo próprio presidente do time, se ele estiver presente. Vale antes do minuto trinta e cinco e cinquenta e nove, mas não durante o escalonado, o gol em dobro, o dado ou o matchball. E o adversário tem direito de resposta.",
  },
  {
    tag: `${T} · Minuto 36`,
    titulo: "Shootouts ou <span>matchball</span>",
    itens: [
      { icone: "🤝", titulo: "Empatado no 36'", texto: "A partida vai direto para os shootouts" },
      { icone: "🔥", titulo: "Matchball", texto: "Se quem está ganhando marcar, o jogo acaba" },
      { icone: "⚖️", titulo: "Empatou no matchball", texto: "O próximo gol decide a partida" },
      { icone: "➖", titulo: "Desescalonado", texto: "A cada minuto sai um jogador de cada lado, até 1x1" },
    ],
    legenda: "O final: shootouts ou modo matchball",
    fala: "No minuto trinta e seis, se o jogo estiver empatado, vai direto para os shootouts. Se não estiver, começa o modo matchball: se o time que está ganhando marcar, o jogo acaba. Se o outro empatar, o próximo gol decide. E a cada minuto sai um jogador de cada lado.",
  },
  {
    tag: `${T} · Shootouts`,
    titulo: "Como é um <span>shootout</span>",
    grande: "5 segundos",
    sub: "A bola fica no meio-campo. O jogador sai com ela e tem 5 segundos para fazer o gol num 1 contra 1 com o goleiro.",
    legenda: "Um contra um saindo do meio-campo",
    fala: "O shootout funciona assim: a bola fica no meio-campo, o jogador sai conduzindo e tem cinco segundos para fazer o gol, num um contra um com o goleiro. É o desempate da Kings League.",
  },
  {
    tag: `${T} · Cartões`,
    titulo: "Cartões e <span>sanções</span>",
    itens: [
      { icone: "🟨", titulo: "Amarelo", texto: "O jogador fica 2 minutos fora e o time joga com um a menos" },
      { icone: "🟥", titulo: "Vermelho", texto: "Expulso; o time fica 5 minutos com um a menos e depois repõe" },
      { icone: "🔥", titulo: "Amarelo no matchball", texto: "Não exclui: dá um shootout ao adversário" },
      { icone: "🔥", titulo: "Vermelho no matchball", texto: "Dá um pênalti ao adversário" },
    ],
    legenda: "Amarelo tira 2 minutos; vermelho, 5 com um a menos",
    fala: "Nos cartões, o amarelo tira o jogador por dois minutos, e o vermelho expulsa, deixando o time com um a menos por cinco minutos. No modo matchball é diferente: o amarelo dá um shootout ao adversário, e o vermelho dá um pênalti.",
  },
  {
    tag: `${T} · Cronômetro`,
    titulo: "Quando o <span>relógio para</span>",
    sub: "O tempo é corrido e começa no primeiro toque na bola. Ele só para em:",
    itens: [
      { icone: "🩺", titulo: "Atendimento médico", texto: "Quando o árbitro chama a equipe médica" },
      { icone: "📺", titulo: "VAR ou revisão", texto: "Revisões da arbitragem" },
      { icone: "🃏", titulo: "Carta ou pênalti do presidente", texto: "Enquanto são executados" },
      { icone: "🐢", titulo: "Perda de tempo", texto: "A critério do árbitro" },
    ],
    legenda: "Tempo corrido, com poucas paradas",
    fala: "O tempo é corrido e começa no primeiro toque na bola. O relógio só para no atendimento médico, nas revisões de arbitragem, na execução de cartas e pênaltis do presidente, e quando o árbitro entender que há cera.",
  },
  {
    tag: `${T} · Classificação`,
    titulo: "A <span>pontuação</span>",
    itens: [
      { icone: "🏆", titulo: "Vitória no tempo", texto: "3 pontos" },
      { icone: "🎯", titulo: "Vitória nos shootouts", texto: "2 pontos" },
      { icone: "🤏", titulo: "Derrota nos shootouts", texto: "1 ponto" },
      { icone: "❌", titulo: "Derrota no tempo", texto: "0 ponto" },
    ],
    legenda: "3 pontos no tempo, 2 e 1 nos shootouts",
    fala: "Na tabela, vitória no tempo normal vale três pontos. Vitória nos shootouts vale dois, e quem perde nos shootouts ainda leva um ponto. Derrota no tempo não pontua.",
  },
  {
    tag: `${T} · Competição`,
    titulo: "Liga e <span>playoffs</span>",
    linha: [
      { quando: "Liga", oque: "Todos jogam contra todos" },
      { quando: "1º", oque: "Vai direto para a semifinal" },
      { quando: "2º a 7º", oque: "Quartas de final: 2x7, 3x6 e 4x5" },
      { quando: "Final", oque: "Os vencedores das semifinais decidem o título" },
    ],
    legenda: "Kings League Brasil: 7 classificados",
    fala: "A competição tem uma fase de liga, com todos contra todos. Na Kings League Brasil, os sete melhores vão aos playoffs: o primeiro colocado vai direto para a semifinal, e nas quartas jogam o segundo contra o sétimo, o terceiro contra o sexto e o quarto contra o quinto.",
  },
  {
    tag: `${T} · No Sistema de Disputa`,
    titulo: "Organize a sua <span>Kings League</span>",
    itens: [
      { icone: "📝", titulo: "Súmula completa", texto: "Gols, cartas, dado, presidente e shootouts; placar calculado sozinho" },
      { icone: "🖨️", titulo: "Súmula impressa", texto: "Já com equipes, jogadores e as fases do jogo" },
      { icone: "⏱️", titulo: "Tempo ajustável", texto: "Encurte o jogo e as fases acompanham" },
      { icone: "📊", titulo: "Tabela e playoffs", texto: "Pontos 3, 2, 1 e 0 e chave automática" },
    ],
    legenda: "Tudo isso pronto no Sistema de Disputa",
    fala: "E tudo isso já está pronto no Sistema de Disputa: súmula completa com o placar calculado sozinho, súmula impressa, tempo ajustável para jogos amadores, tabela com a pontuação da Kings League e os playoffs gerados automaticamente. Para ver na prática, assista ao vídeo sobre a Kings League no sistema.",
  },
];

(async () => {
  const saida = await gravar({
    nome: "11-kings-league-regras",
    largura: 1280,
    inicio: "/__slides/0",
    antes: (page) => servirSlides(page, slides),
    etiqueta: "Regras da modalidade",
    titulo: "Kings League: <span>todas as regras</span>",
    subtitulo: "Do escalonado aos shootouts",
    abertura: "Neste vídeo você vai entender todas as regras da Kings League, do primeiro minuto até os shootouts, e como funciona a classificação.",
    encerramento: "Agora você conhece todas as regras da Kings League. Monte o seu campeonato no Sistema de Disputa!",
    etiquetaFim: "Fim",
    proximo: "Obrigado por assistir",
    passos: passosDeSlides(slides, BASE),
  });
  console.log("OK", saida);
})().catch((e) => {
  console.error("ERRO:", e);
  process.exit(1);
});
