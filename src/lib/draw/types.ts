export interface DrawTeam {
  id: string;
  /** 1 = cabeças de chave. Vazio/null = último pote. */
  pot: number | null;
}

export type DrawKind = "GROUPS" | "KNOCKOUT";

export interface DrawStep {
  teamId: string;
  /** Pote efetivo (1..N) em que a equipe estava. */
  pot: number;
  /** GROUPS: índice do grupo sorteado (0 = Grupo A). */
  groupIndex?: number;
  /** KNOCKOUT: posição na lista da chave (0-based), na ordem que o construtor da chave consome. */
  slot?: number;
}
