import type { SumulaTeam } from "@/components/sumula/PrintableSumula";

/** CPF com pontuação (só para exibir na súmula impressa). */
export function formatCpf(digits: string): string {
  const d = digits.replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : digits;
}

/** Documento impresso na súmula: o RG; sem RG, o CPF. */
export function sumulaDocument(rg: string | null, cpf: string | null | undefined): string | null {
  if (rg && rg.trim()) return rg.trim();
  if (cpf) return `CPF ${formatCpf(cpf)}`;
  return null;
}

const BRACKET_LABEL: Record<string, string> = {
  WINNERS: "Chave principal",
  LOSERS: "Repescagem",
  GRAND_FINAL: "Grande final",
};

export function sumulaPhaseLabel(bracket: string, round: number, groupName: string | null): string {
  if (bracket === "GROUP") return groupName ?? "Fase de grupos";
  if (bracket === "GRAND_FINAL") return BRACKET_LABEL.GRAND_FINAL;
  return `${BRACKET_LABEL[bracket] ?? bracket} · rodada ${round}`;
}

export function toSumulaTeam(team: {
  name: string;
  managerName: string;
  players: { shirtNumber: number | null; name: string; rg: string | null; isGoalkeeper: boolean; athlete: { document: string | null } }[];
}): SumulaTeam {
  return {
    name: team.name,
    managerName: team.managerName,
    players: team.players.map((p) => ({
      shirtNumber: p.shirtNumber,
      name: p.name,
      doc: sumulaDocument(p.rg, p.athlete.document),
      isGoalkeeper: p.isGoalkeeper,
    })),
  };
}
