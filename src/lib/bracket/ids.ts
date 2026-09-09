/** Deterministic, human-readable ids for generated matches (e.g. "WB-R1-4"). Remapped to real
 * database ids by the persistence layer — never written to the database as-is. */
export function createIdGenerator(prefix: string) {
  let n = 0;
  return () => `${prefix}-${++n}`;
}
