import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "./assistant";
import { formatBRL } from "./plans";

describe("buildSystemPrompt", () => {
  it("includes the current promo price while the promo is running", () => {
    const prompt = buildSystemPrompt(new Date("2026-09-12T00:00:00Z"));
    expect(prompt).toContain(`Pro: ${formatBRL(8700)}/mês (oferta de lançamento, preço normal ${formatBRL(14700)}/mês)`);
  });

  it("falls back to the regular price once the promo ends", () => {
    const prompt = buildSystemPrompt(new Date("2026-09-20T00:00:00Z"));
    expect(prompt).toContain(`Pro: ${formatBRL(14700)}/mês.`);
    expect(prompt).not.toContain("oferta de lançamento");
  });

  it("lists exactly the 7 real sports and warns against inventing custom ones", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("Futebol de campo, Futsal, Futebol 7, Handebol, Vôlei, Basquete, Tênis de mesa");
    expect(prompt).toContain("Não existe opção de criar um esporte novo");
  });

  it("warns against claiming automatic PIX split/payout", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("NÃO existe ainda repasse automático/split");
  });

  it("includes the Start avulso one-off pricing", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain(`Também vendido avulso por ${formatBRL(2500)}`);
  });
});
