/**
 * Kings League: regras puras (sem banco), usadas pela súmula, pelo encerramento
 * da partida e pela folha impressa.
 *
 * Fonte: kingsleague.pro/pt/como-se-joga. O jogo oficial tem 20 + 16 minutos e as
 * fases caem nos minutos 5, 17, 20, 23 e 36. Campeonatos amadores podem encurtar
 * os tempos; as fases são escaladas na mesma proporção.
 */

export type GoalKind = "NORMAL" | "DOUBLE_PHASE" | "CARD_DOUBLE" | "STAR_PLAYER" | "PENALTY" | "SHOOTOUT" | "MATCHBALL";
export type SecretCard = "GOL_X2" | "SUSPENSAO" | "JOGADOR_ESTRELA" | "SHOOTOUT" | "CORINGA" | "PENALTI_INVERSO" | "PENALTI";
export type KingsEventType = "SECRET_CARD" | "PRESIDENT_PENALTY" | "DICE";

export const OFFICIAL_FIRST_HALF = 20;
export const OFFICIAL_SECOND_HALF = 16;
export const MIN_HALF_MINUTES = 4;
export const MAX_HALF_MINUTES = 45;

export const GOAL_KIND_LABELS: Record<GoalKind, string> = {
  NORMAL: "Gol",
  DOUBLE_PHASE: "Gol em dobro (fim do 1º tempo)",
  CARD_DOUBLE: "Gol com a carta Gol x2",
  STAR_PLAYER: "1º gol do jogador estrela",
  PENALTY: "Pênalti (carta)",
  SHOOTOUT: "Shootout (carta ou matchball)",
  MATCHBALL: "Gol no modo matchball",
};

export const SECRET_CARD_LABELS: Record<SecretCard, string> = {
  GOL_X2: "Gol x2",
  SUSPENSAO: "Suspensão",
  JOGADOR_ESTRELA: "Jogador estrela",
  SHOOTOUT: "Shootout",
  CORINGA: "Coringa",
  PENALTI_INVERSO: "Pênalti inverso",
  PENALTI: "Pênalti",
};

export const SECRET_CARD_EFFECTS: Record<SecretCard, string> = {
  GOL_X2: "Por 4 minutos, todo gol do time vale 2.",
  SUSPENSAO: "Um jogador adversário (não o goleiro) fica 4 minutos fora.",
  JOGADOR_ESTRELA: "O primeiro gol do jogador escolhido vale 2. Ele usa braçadeira.",
  SHOOTOUT: "Bola no meio-campo: 5 segundos para um 1x1 contra o goleiro.",
  CORINGA: "Usa qualquer outra carta ou rouba a carta do adversário.",
  PENALTI_INVERSO: "O adversário bate um pênalti: se marcar, não vale; se errar, o gol é do time da carta.",
  PENALTI: "Um pênalti normal.",
};

export const SECRET_CARDS = Object.keys(SECRET_CARD_LABELS) as SecretCard[];
export const GOAL_KINDS = Object.keys(GOAL_KIND_LABELS) as GoalKind[];

/** Quanto um gol vale no placar. */
export function goalValue(kind: GoalKind): number {
  return kind === "DOUBLE_PHASE" || kind === "CARD_DOUBLE" || kind === "STAR_PLAYER" ? 2 : 1;
}

export interface KingsPhases {
  firstHalf: number;
  secondHalf: number;
  /** Fim do escalonado (1x1 → 7x7). */
  staggeredEnd: number;
  /** Início do gol em dobro (fim da 1ª janela de cartas). */
  doubleStart: number;
  /** Fim do 1º tempo = início do dado. */
  halfTime: number;
  /** Fim do dado = início da 2ª janela de cartas. */
  diceEnd: number;
  /** Fim do tempo = matchball ou shootouts. */
  end: number;
}

/**
 * Minutos de cada fase. Com 20 + 16 devolve exatamente o oficial: escalonado até 5',
 * cartas de 5' a 17', gol em dobro de 17' a 20', dado de 20' a 23', cartas de 23' a 36'.
 */
export function kingsPhases(firstHalf?: number | null, secondHalf?: number | null): KingsPhases {
  const h1 = firstHalf ?? OFFICIAL_FIRST_HALF;
  const h2 = secondHalf ?? OFFICIAL_SECOND_HALF;
  const f1 = h1 / OFFICIAL_FIRST_HALF;
  const f2 = h2 / OFFICIAL_SECOND_HALF;
  const staggeredEnd = Math.max(1, Math.round(5 * f1));
  const doubleLength = Math.max(1, Math.round(3 * f1));
  const diceLength = Math.max(1, Math.round(3 * f2));
  return {
    firstHalf: h1,
    secondHalf: h2,
    staggeredEnd,
    doubleStart: Math.max(staggeredEnd, h1 - doubleLength),
    halfTime: h1,
    diceEnd: Math.min(h1 + h2, h1 + diceLength),
    end: h1 + h2,
  };
}

export type KingsPhase = "STAGGERED" | "CARDS_1" | "DOUBLE" | "DICE" | "CARDS_2" | "MATCHBALL";

/** Fase em que um minuto (do relógio corrido, 0 = início) cai. */
export function phaseAt(minute: number, p: KingsPhases): KingsPhase {
  if (minute < p.staggeredEnd) return "STAGGERED";
  if (minute < p.doubleStart) return "CARDS_1";
  if (minute < p.halfTime) return "DOUBLE";
  if (minute < p.diceEnd) return "DICE";
  if (minute < p.end) return "CARDS_2";
  return "MATCHBALL";
}

export const PHASE_LABELS: Record<KingsPhase, string> = {
  STAGGERED: "Escalonado",
  CARDS_1: "Cartas secretas e pênalti do presidente",
  DOUBLE: "Gols em dobro",
  DICE: "Dado",
  CARDS_2: "Cartas secretas e pênalti do presidente",
  MATCHBALL: "Matchball ou shootouts",
};

/** Tipo de gol sugerido pelo minuto: no fim do 1º tempo os gols valem em dobro. */
export function suggestGoalKind(minute: number, p: KingsPhases): GoalKind {
  const phase = phaseAt(minute, p);
  if (phase === "DOUBLE") return "DOUBLE_PHASE";
  if (phase === "MATCHBALL") return "MATCHBALL";
  return "NORMAL";
}

function inCardWindow(minute: number, p: KingsPhases): boolean {
  const phase = phaseAt(minute, p);
  return phase === "CARDS_1" || phase === "CARDS_2";
}

export interface ExistingEvent {
  type: KingsEventType;
  teamId: string | null;
}

/** Carta secreta: uma por time por jogo, só nas janelas de cartas. Devolve a mensagem de erro ou null. */
export function validateSecretCard(minute: number, teamId: string, existing: ExistingEvent[], p: KingsPhases): string | null {
  if (!inCardWindow(minute, p)) {
    return `Carta secreta só pode ser usada entre ${p.staggeredEnd}' e ${p.doubleStart}' ou entre ${p.diceEnd}' e ${p.end}'.`;
  }
  if (existing.some((e) => e.type === "SECRET_CARD" && e.teamId === teamId)) {
    return "Este time já usou a carta secreta nesta partida.";
  }
  return null;
}

/**
 * Pênalti do presidente: nas janelas de cartas (fora do escalonado, gol em dobro, dado e
 * matchball). Cada time pode acionar o seu uma vez; o adversário pode responder com o dele,
 * então o limite é um por time.
 */
export function validatePresidentPenalty(minute: number, teamId: string, existing: ExistingEvent[], p: KingsPhases): string | null {
  if (!inCardWindow(minute, p)) {
    return `O pênalti do presidente só pode ser acionado entre ${p.staggeredEnd}' e ${p.doubleStart}' ou entre ${p.diceEnd}' e ${p.end}' (antes do matchball).`;
  }
  if (existing.some((e) => e.type === "PRESIDENT_PENALTY" && e.teamId === teamId)) {
    return "Este time já usou o pênalti do presidente nesta partida.";
  }
  return null;
}

export function validateDice(result: number, existing: ExistingEvent[]): string | null {
  if (![1, 2, 3].includes(result)) return "O dado só tem os resultados 1x1, 2x2 e 3x3.";
  if (existing.some((e) => e.type === "DICE")) return "O dado desta partida já foi registrado.";
  return null;
}

export interface ScoreGoal {
  teamId: string;
  value: number;
}

export interface ScoreEvent {
  teamId: string | null;
  goalsAwarded: number;
}

/** Placar no tempo: soma do valor dos gols + gols "sem autor" (pênalti do presidente, pênalti inverso). */
export function kingsScore(goals: ScoreGoal[], events: ScoreEvent[], homeTeamId: string, awayTeamId: string): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const g of goals) {
    if (g.teamId === homeTeamId) home += g.value;
    else if (g.teamId === awayTeamId) away += g.value;
  }
  for (const e of events) {
    if (e.teamId === homeTeamId) home += e.goalsAwarded;
    else if (e.teamId === awayTeamId) away += e.goalsAwarded;
  }
  return { home, away };
}

/** Lê a duração de um tempo vinda de formulário; vazio = oficial. */
export function parseHalfMinutes(raw: unknown): number | null | "invalid" {
  if (raw === null || raw === undefined || String(raw).trim() === "") return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < MIN_HALF_MINUTES || n > MAX_HALF_MINUTES) return "invalid";
  return n;
}
