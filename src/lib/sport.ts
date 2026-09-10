export const SPORT_TYPES = [
  "FUTEBOL_CAMPO",
  "FUTSAL",
  "FUTEBOL_7",
  "HANDEBOL",
  "VOLEIBOL",
  "BASQUETE",
  "TENIS_DE_MESA",
] as const;

export type SportType = (typeof SPORT_TYPES)[number];

export type SportFamily = "GOALS_CARDS" | "SETS_CARDS" | "PERIODS_FOULS" | "TABLE_TENNIS_TIES";

export const SPORT_LABELS: Record<SportType, string> = {
  FUTEBOL_CAMPO: "Futebol de campo",
  FUTSAL: "Futsal",
  FUTEBOL_7: "Futebol 7",
  HANDEBOL: "Handebol",
  VOLEIBOL: "Vôlei",
  BASQUETE: "Basquete",
  TENIS_DE_MESA: "Tênis de mesa",
};

const SPORT_FAMILY: Record<SportType, SportFamily> = {
  FUTEBOL_CAMPO: "GOALS_CARDS",
  FUTSAL: "GOALS_CARDS",
  FUTEBOL_7: "GOALS_CARDS",
  HANDEBOL: "GOALS_CARDS",
  VOLEIBOL: "SETS_CARDS",
  BASQUETE: "PERIODS_FOULS",
  TENIS_DE_MESA: "TABLE_TENNIS_TIES",
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
