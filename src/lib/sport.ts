export const SPORT_TYPES = [
  "FUTEBOL_CAMPO",
  "FUTSAL",
  "FUTEBOL_7",
  "HANDEBOL",
  "VOLEIBOL",
  "BASQUETE",
  "TENIS_DE_MESA",
  "FIFA",
  "JUST_DANCE",
  "FREE_FIRE",
  "KINGS_LEAGUE",
] as const;

export type SportType = (typeof SPORT_TYPES)[number];

export type SportFamily = "GOALS_CARDS" | "SETS_CARDS" | "PERIODS_FOULS" | "TABLE_TENNIS_TIES" | "SCORE_ONLY" | "LOBBY_POINTS" | "KINGS";

export const SPORT_LABELS: Record<SportType, string> = {
  FUTEBOL_CAMPO: "Futebol de campo",
  FUTSAL: "Futsal",
  FUTEBOL_7: "Futebol 7",
  HANDEBOL: "Handebol",
  VOLEIBOL: "Vôlei",
  BASQUETE: "Basquete",
  TENIS_DE_MESA: "Tênis de mesa",
  FIFA: "FIFA / EA FC",
  JUST_DANCE: "Just Dance",
  FREE_FIRE: "Free Fire",
  KINGS_LEAGUE: "Kings League",
};

const SPORT_FAMILY: Record<SportType, SportFamily> = {
  FUTEBOL_CAMPO: "GOALS_CARDS",
  FUTSAL: "GOALS_CARDS",
  FUTEBOL_7: "GOALS_CARDS",
  HANDEBOL: "GOALS_CARDS",
  VOLEIBOL: "SETS_CARDS",
  BASQUETE: "PERIODS_FOULS",
  TENIS_DE_MESA: "TABLE_TENNIS_TIES",
  FIFA: "SCORE_ONLY",
  JUST_DANCE: "SCORE_ONLY",
  FREE_FIRE: "LOBBY_POINTS",
  // Futebol 7 com as regras da Kings League: gols que valem 2, cartas secretas, dado, shootouts.
  KINGS_LEAGUE: "KINGS",
};

/**
 * The bracket/standings engine only ever compares homeScore vs awayScore as
 * plain numbers — it has no idea what a "goal" or a "set" is. The sport
 * family just tells the súmula layer how to compute those two numbers (and
 * which events it records to get there).
 */
export function getSportFamily(sportType: SportType): SportFamily {
  return SPORT_FAMILY[sportType];
}

/**
 * Minimum roster size to field a starting lineup in each modality — not a
 * squad-size cap, just enough players to actually take the court/field.
 * Tênis de mesa is confronto por jogos individuais/duplas, not a fixed
 * on-court lineup, so its minimum is 1 (already implied by "at least one
 * player" — kept here for a uniform lookup and an explicit number to show).
 */
export const MIN_PLAYERS_PER_TEAM: Record<SportType, number> = {
  FUTEBOL_CAMPO: 11,
  FUTSAL: 5,
  FUTEBOL_7: 7,
  HANDEBOL: 7,
  VOLEIBOL: 6,
  BASQUETE: 5,
  TENIS_DE_MESA: 1,
  // Jogos eletrônicos 1x1: a "equipe" é o próprio jogador.
  FIFA: 1,
  JUST_DANCE: 1,
  // Esquadrão de Free Fire: 4 em campo (regulamentos oficiais aceitam 1 reserva).
  FREE_FIRE: 4,
  // Kings League: 6 de linha + goleiro.
  KINGS_LEAGUE: 7,
};

/**
 * Maximum roster size per team, where the organizer wants one. Undefined =
 * no cap. Futsal and Free Fire (4 titulares + 1 reserva) have one.
 */
export const MAX_PLAYERS_PER_TEAM: Partial<Record<SportType, number>> = {
  FUTSAL: 15,
  FREE_FIRE: 5,
};

/**
 * Sports whose knockout matches can be level after regular time and go to a
 * penalty shootout: futebol, futsal, futebol 7 e handebol (tiros de 7 metros),
 * FIFA/EA FC (after extra time) and the Kings League, where every tie (league
 * stage included) goes to shootouts. Just Dance has no draws.
 */
export function supportsPenalties(sportType: SportType): boolean {
  // Futebol, futsal, futebol 7 e handebol: mata-mata empatado vai para os pênaltis (no handebol, tiros de 7 metros).
  return sportType === "FIFA" || sportType === "KINGS_LEAGUE" || getSportFamily(sportType) === "GOALS_CARDS";
}

/** Kings League: não existe empate, nem na fase de liga — o empate vai para os shootouts. */
export function shootoutDecidesLeagueDraws(sportType: SportType): boolean {
  return sportType === "KINGS_LEAGUE";
}

/** Nome da disputa de desempate: "shootouts" na Kings League, "pênaltis" nos outros. */
export function shootoutLabel(sportType: SportType): string {
  if (sportType === "KINGS_LEAGUE") return "shootouts";
  if (sportType === "HANDEBOL") return "tiros de 7 metros";
  return "pênaltis";
}

/** Esportes com goleiro (checkbox de goleiro na ficha e ranking de melhor goleiro). */
export function hasGoalkeeper(sportType: SportType): boolean {
  const family = getSportFamily(sportType);
  return family === "GOALS_CARDS" || family === "KINGS";
}
