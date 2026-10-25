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
] as const;

export type SportType = (typeof SPORT_TYPES)[number];

export type SportFamily = "GOALS_CARDS" | "SETS_CARDS" | "PERIODS_FOULS" | "TABLE_TENNIS_TIES" | "SCORE_ONLY" | "LOBBY_POINTS";

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
 * penalty shootout. In FIFA/EA FC a tie is settled by extra time and then
 * penalties; Just Dance has no draws (the higher song score wins).
 */
export function supportsPenalties(sportType: SportType): boolean {
  return sportType === "FIFA";
}
