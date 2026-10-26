import { z } from "zod";

export const TOURNAMENT_NAME_MAX_LENGTH = 100;

/** Name typed when renaming a tournament; surrounding spaces are dropped. */
export const tournamentNameSchema = z
  .string()
  .trim()
  .min(2, "Informe o nome do torneio")
  .max(TOURNAMENT_NAME_MAX_LENGTH, `O nome pode ter no máximo ${TOURNAMENT_NAME_MAX_LENGTH} caracteres.`);
