/** Vídeo 10 — como funciona cada modalidade no Sistema de Disputa (slides). */
const { gravar, BASE } = require("./lib.cjs");
const { servirSlides, passosDeSlides } = require("./slides.cjs");

const T = "Modalidades";
const slides = [
  {
    tag: T,
    titulo: "<span>11 modalidades</span> num só sistema",
    itens: [
      { icone: "⚽", titulo: "Futebol de campo, futsal e futebol 7" },
      { icone: "🤾", titulo: "Handebol" },
      { icone: "🏐", titulo: "Vôlei" },
      { icone: "🏀", titulo: "Basquete" },
      { icone: "🏓", titulo: "Tênis de mesa" },
      { icone: "🎮", titulo: "FIFA / EA FC" },
      { icone: "💃", titulo: "Just Dance" },
      { icone: "🔫", titulo: "Free Fire" },
      { icone: "👑", titulo: "Kings League" },
    ],
    colunas: 3,
    legenda: "Esportes e jogos eletrônicos",
    fala: "O Sistema de Disputa organiza onze modalidades: futebol de campo, futsal, futebol sete, handebol, vôlei, basquete, tênis de mesa, e também os jogos eletrônicos FIFA, Just Dance e Free Fire, além da Kings League. Cada uma tem a sua própria súmula. Vamos ver como cada uma funciona.",
  },
  {
    tag: `${T} · Futebol`,
    titulo: "Futebol de campo, <span>futsal</span> e futebol 7",
    itens: [
      { icone: "⚽", titulo: "Súmula", texto: "Gols com o minuto e o autor, cartões amarelo e vermelho" },
      { icone: "🥅", titulo: "Mata-mata empatado", texto: "Decidido nos pênaltis, lançados junto com o placar" },
      { icone: "📊", titulo: "Estatísticas", texto: "Artilharia, cartões e melhor goleiro" },
      { icone: "🧤", titulo: "Goleiro", texto: "Marcado na ficha de inscrição de cada equipe" },
    ],
    legenda: "Gols, cartões e pênaltis no mata-mata",
    fala: "No futebol de campo, no futsal e no futebol sete, a súmula registra os gols, com o minuto e o autor, e os cartões. Na fase de grupos pode haver empate, mas no mata-mata o empate é decidido nos pênaltis. As estatísticas mostram a artilharia, os cartões e o melhor goleiro.",
  },
  {
    tag: `${T} · Handebol`,
    titulo: "<span>Handebol</span>",
    itens: [
      { icone: "🤾", titulo: "Súmula", texto: "Gols e cartões, como no futebol" },
      { icone: "⏱️", titulo: "Exclusões de 2 minutos", texto: "Têm espaço próprio na súmula impressa" },
      { icone: "🎯", titulo: "Mata-mata empatado", texto: "Decidido nos tiros de 7 metros" },
      { icone: "👥", titulo: "Equipes", texto: "Mínimo de 7 jogadores" },
    ],
    legenda: "Empate no mata-mata: tiros de 7 metros",
    fala: "O handebol funciona parecido: gols e cartões na súmula, com espaço para as exclusões de dois minutos na súmula impressa. No mata-mata, o empate é decidido nos tiros de sete metros.",
  },
  {
    tag: `${T} · Vôlei`,
    titulo: "<span>Vôlei</span>",
    itens: [
      { icone: "🏐", titulo: "Placar por sets", texto: "Lance os pontos de cada set; o sistema conta os sets vencidos" },
      { icone: "🔢", titulo: "Sets", texto: "Até 25 pontos, o 5º até 15, sempre com 2 de vantagem" },
      { icone: "🏆", titulo: "Vencedor", texto: "Quem ganhar mais sets; não existe empate" },
      { icone: "🟨", titulo: "Cartões", texto: "Registrados por set" },
    ],
    legenda: "O resultado sai dos sets",
    fala: "No vôlei, você lança os pontos de cada set, e o sistema conta quantos sets cada time venceu. Vence quem ganhar mais sets, então não existe empate. Os cartões também são registrados por set.",
  },
  {
    tag: `${T} · Basquete`,
    titulo: "<span>Basquete</span>",
    itens: [
      { icone: "🏀", titulo: "Cestas", texto: "De 1, 2 ou 3 pontos, por jogador e por quarto" },
      { icone: "➕", titulo: "Placar", texto: "Somado sozinho a partir das cestas" },
      { icone: "✋", titulo: "Faltas", texto: "Faltas pessoais de cada jogador" },
      { icone: "📊", titulo: "Estatísticas", texto: "Cestinhas e ranking de faltas" },
    ],
    legenda: "Cestas de 1, 2 e 3 pontos por quarto",
    fala: "No basquete, cada cesta é lançada com o jogador, o quarto e o valor: um, dois ou três pontos. O placar é somado sozinho, as faltas ficam registradas por jogador, e as estatísticas mostram os cestinhas.",
  },
  {
    tag: `${T} · Tênis de mesa`,
    titulo: "<span>Tênis de mesa</span>",
    itens: [
      { icone: "🏓", titulo: "Confronto entre equipes", texto: "Vários jogos de simples ou de duplas" },
      { icone: "🔢", titulo: "Cada jogo", texto: "Sets até 11 pontos; o sistema descobre o vencedor" },
      { icone: "🏆", titulo: "Vencedor do confronto", texto: "A equipe que ganhar mais jogos" },
      { icone: "📊", titulo: "Estatísticas", texto: "Jogos vencidos por jogador" },
    ],
    legenda: "Confronto de jogos individuais e duplas",
    fala: "No tênis de mesa, um confronto entre duas equipes tem vários jogos, de simples ou de duplas. Em cada jogo você lança os sets, e o sistema descobre o vencedor. Ganha o confronto a equipe que vencer mais jogos.",
  },
  {
    tag: `${T} · FIFA / EA FC`,
    titulo: "<span>FIFA</span> / EA FC",
    itens: [
      { icone: "🎮", titulo: "1 contra 1", texto: "Cada participante é uma equipe de um jogador" },
      { icone: "⚽", titulo: "Resultado", texto: "Gols de cada lado no tempo normal e na prorrogação" },
      { icone: "🥅", titulo: "Mata-mata empatado", texto: "Decidido nos pênaltis" },
    ],
    colunas: 3,
    legenda: "Confronto 1x1, com pênaltis no mata-mata",
    fala: "No FIFA, cada participante é uma equipe de um jogador só, num confronto um contra um. Você lança o placar do tempo normal e da prorrogação, e no mata-mata o empate vai para os pênaltis.",
  },
  {
    tag: `${T} · Just Dance`,
    titulo: "<span>Just Dance</span>",
    itens: [
      { icone: "💃", titulo: "Mata-mata 1x1", texto: "Vence quem fizer mais pontos na música" },
      { icone: "👯", titulo: "Baterias de até 4", texto: "Dançam juntos a mesma música; avançam os 2 melhores" },
      { icone: "🔁", titulo: "Empate", texto: "Repete a música" },
    ],
    colunas: 3,
    legenda: "Mata-mata 1x1 ou baterias de até 4",
    fala: "O Just Dance tem dois formatos. No mata-mata, é um contra um, e vence quem fizer mais pontos na música. Nas baterias, até quatro dançarinos dançam a mesma música, e avançam os dois melhores, até a bateria final.",
  },
  {
    tag: `${T} · Free Fire`,
    titulo: "<span>Free Fire</span> em quedas",
    itens: [
      { icone: "🪂", titulo: "Quedas", texto: "Até 12 equipes de 4 a 5 jogadores na mesma sala" },
      { icone: "🥇", titulo: "Colocação", texto: "1º 12 pontos, 2º 9, 3º 8… até 0" },
      { icone: "💥", titulo: "Abates", texto: "Mais 1 ponto por abate" },
      { icone: "🏁", titulo: "Tabela e final", texto: "Pontos corridos; os melhores podem jogar uma grande final" },
    ],
    legenda: "Pontos por colocação e por abate",
    fala: "O Free Fire funciona em quedas. Até doze equipes jogam juntas na mesma sala e pontuam pela colocação, doze pontos para o primeiro, nove para o segundo e assim por diante, mais um ponto por abate. Os pontos somam numa tabela, e os melhores podem disputar uma grande final.",
  },
  {
    tag: `${T} · Kings League`,
    titulo: "<span>Kings League</span>",
    itens: [
      { icone: "⏱️", titulo: "20 + 16 minutos", texto: "Escalonado, gol em dobro, dado e matchball" },
      { icone: "🃏", titulo: "Cartas secretas", texto: "E o pênalti do presidente" },
      { icone: "🎯", titulo: "Sem empate", texto: "Shootouts; tabela com 3, 2, 1 e 0 pontos" },
      { icone: "🏆", titulo: "Liga e playoffs", texto: "O 1º vai direto para a semifinal" },
    ],
    legenda: "Tem um vídeo só com as regras",
    fala: "E a Kings League, o futebol sete com escalonado, gol em dobro, dado, cartas secretas, pênalti do presidente e shootouts. Ela tem um vídeo só dela, com todas as regras explicadas.",
  },
  {
    tag: `${T} · Formatos`,
    titulo: "Os <span>formatos</span> de disputa",
    itens: [
      { icone: "🌳", titulo: "Mata-mata", texto: "Eliminatória simples" },
      { icone: "🔁", titulo: "Eliminatória dupla", texto: "Com repescagem: só sai quem perde duas vezes" },
      { icone: "🧩", titulo: "Grupos + mata-mata", texto: "Com um grupo só, vira liga com todos contra todos" },
      { icone: "🎲", titulo: "Sorteio oficial", texto: "Com potes, ao vivo, equipe por equipe" },
    ],
    legenda: "Mata-mata, dupla eliminação ou grupos",
    fala: "Em todas as modalidades, você escolhe o formato: mata-mata, eliminatória dupla com repescagem, ou grupos seguidos de mata-mata. Com um grupo só, vira uma liga com todos contra todos. E o sorteio é feito ao vivo, com potes, como numa competição oficial.",
  },
  {
    tag: `${T} · Planos`,
    titulo: "Qual plano <span>tem cada uma</span>",
    itens: [
      { icone: "🆓", titulo: "Grátis e Start", texto: "Futebol de campo e futsal" },
      { icone: "🚀", titulo: "Pro e Liga", texto: "Todas as 11 modalidades" },
      { icone: "🏢", titulo: "Corporativo", texto: "Todas, com o sistema no domínio da sua organização" },
    ],
    colunas: 3,
    legenda: "Todas as modalidades nos planos Pro e Liga",
    fala: "O pacote grátis e o plano Start incluem futebol de campo e futsal. Os planos Pro e Liga liberam todas as onze modalidades. E o Corporativo também, com o sistema no domínio da sua organização.",
  },
];

(async () => {
  const saida = await gravar({
    nome: "10-modalidades",
    largura: 1280,
    inicio: "/__slides/0",
    antes: (page) => servirSlides(page, slides),
    etiqueta: "Vídeo extra · Modalidades",
    titulo: "Como funciona <span>cada modalidade</span>",
    subtitulo: "Do futebol ao Free Fire",
    abertura: "Neste vídeo você vai ver como cada modalidade funciona no Sistema de Disputa: a súmula, o desempate e as estatísticas de cada uma.",
    encerramento: "Agora é só escolher a sua modalidade e montar o campeonato. Até a próxima!",
    etiquetaFim: "Fim",
    proximo: "Obrigado por assistir",
    passos: passosDeSlides(slides, BASE),
  });
  console.log("OK", saida);
})().catch((e) => {
  console.error("ERRO:", e);
  process.exit(1);
});
