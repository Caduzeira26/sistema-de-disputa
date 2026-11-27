import { describe, expect, it } from "vitest";
import { formatCpf, sumulaDocument, sumulaPhaseLabel } from "./sumulaPrint";

describe("súmula impressa", () => {
  it("prints the RG and falls back to the CPF", () => {
    expect(sumulaDocument("12.345.678-9", "12345678909")).toBe("12.345.678-9");
    expect(sumulaDocument(null, "12345678909")).toBe("CPF 123.456.789-09");
    expect(sumulaDocument("  ", null)).toBeNull();
    expect(formatCpf("123")).toBe("123");
  });

  it("names the phase of the match", () => {
    expect(sumulaPhaseLabel("GROUP", 1, "Grupo A")).toBe("Grupo A");
    expect(sumulaPhaseLabel("WINNERS", 2, null)).toBe("Chave principal · rodada 2");
    expect(sumulaPhaseLabel("LOSERS", 1, null)).toBe("Repescagem · rodada 1");
    expect(sumulaPhaseLabel("GRAND_FINAL", 4, null)).toBe("Grande final");
  });
});
