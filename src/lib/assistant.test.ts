import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildRegistrationSystemPrompt, buildRosterCompletionSystemPrompt, buildSystemPrompt, isPlatformOwner } from "./assistant";
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

describe("buildRegistrationSystemPrompt", () => {
  const baseTournament = {
    name: "Copa Teste",
    sportType: "FUTSAL" as const,
    registrationFeeCents: null,
    status: "REGISTRATION_OPEN" as const,
  };

  it("describes a free tournament as pending manual approval", () => {
    const prompt = buildRegistrationSystemPrompt(baseTournament, { canManageAthleteRegistry: false });
    expect(prompt).toContain("GRATUITA");
    expect(prompt).toContain("status \"Pendente\"");
  });

  it("describes a paid tournament with the real fee and auto-approval on payment", () => {
    const prompt = buildRegistrationSystemPrompt(
      { ...baseTournament, registrationFeeCents: 3000 },
      { canManageAthleteRegistry: false }
    );
    expect(prompt).toContain(`PAGA: ${formatBRL(3000)}`);
    expect(prompt).toContain("aprovada automaticamente");
  });

  it("requires CPF only when the organizer's plan has the athlete registry", () => {
    const withRegistry = buildRegistrationSystemPrompt(baseTournament, { canManageAthleteRegistry: true });
    expect(withRegistry).toContain("precisa informar o CPF");

    const withoutRegistry = buildRegistrationSystemPrompt(baseTournament, { canManageAthleteRegistry: false });
    expect(withoutRegistry).toContain("não pede CPF");
  });

  it("never lists subscription plan pricing (that's the sales assistant's job)", () => {
    const prompt = buildRegistrationSystemPrompt(baseTournament, { canManageAthleteRegistry: false });
    expect(prompt).not.toContain("/mês");
    expect(prompt).toContain("NÃO é o assistente de vendas");
  });

  it("mentions the sport's minimum roster size and that submission is blocked below it", () => {
    const prompt = buildRegistrationSystemPrompt(baseTournament, { canManageAthleteRegistry: false });
    expect(prompt).toContain("no mínimo 5 jogadores");
    expect(prompt).toContain("fica bloqueado");
  });

  it("says nothing about a minimum for a sport whose minimum is 1", () => {
    const prompt = buildRegistrationSystemPrompt(
      { ...baseTournament, sportType: "TENIS_DE_MESA" },
      { canManageAthleteRegistry: false }
    );
    expect(prompt).not.toContain("exige no mínimo");
  });
});

describe("buildRosterCompletionSystemPrompt", () => {
  const team = { name: "Time A", status: "APPROVED" as const };
  const baseTournament = {
    name: "Copa Teste",
    sportType: "FUTSAL" as const,
    status: "REGISTRATION_CLOSED" as const,
    startDate: new Date("2026-09-20T00:00:00Z"),
  };

  it("states the deadline as one day before the start date when the window is open", () => {
    const prompt = buildRosterCompletionSystemPrompt(
      team,
      baseTournament,
      { canManageAthleteRegistry: false },
      new Date("2026-09-10T00:00:00Z")
    );
    expect(prompt).toContain("vai até 19/09/2026");
  });

  it("says the deadline already passed once the window is closed by date", () => {
    const prompt = buildRosterCompletionSystemPrompt(
      team,
      baseTournament,
      { canManageAthleteRegistry: false },
      new Date("2026-09-19T12:00:00Z")
    );
    expect(prompt).toContain("já passou");
  });

  it("says the tournament already started when status is IN_PROGRESS, regardless of the date", () => {
    const prompt = buildRosterCompletionSystemPrompt(
      team,
      { ...baseTournament, status: "IN_PROGRESS", startDate: new Date("2099-01-01T00:00:00Z") },
      { canManageAthleteRegistry: false }
    );
    expect(prompt).toContain("já começou ou terminou");
  });

  it("says the team was rejected and can't be completed", () => {
    const prompt = buildRosterCompletionSystemPrompt(
      { ...team, status: "REJECTED" },
      baseTournament,
      { canManageAthleteRegistry: false }
    );
    expect(prompt).toContain("REJEITADA");
  });

  it("requires CPF for new players only when the organizer's plan has the athlete registry", () => {
    const withRegistry = buildRosterCompletionSystemPrompt(team, baseTournament, { canManageAthleteRegistry: true });
    expect(withRegistry).toContain("também precisa de CPF");

    const withoutRegistry = buildRosterCompletionSystemPrompt(team, baseTournament, { canManageAthleteRegistry: false });
    expect(withoutRegistry).toContain("não pede CPF");
  });

  it("makes clear this page only adds players, never edits or removes them", () => {
    const prompt = buildRosterCompletionSystemPrompt(team, baseTournament, { canManageAthleteRegistry: false });
    expect(prompt).toContain("não edita nem remove nenhum jogador já cadastrado");
  });

  it("never lists subscription plan pricing (that's the sales assistant's job)", () => {
    const prompt = buildRosterCompletionSystemPrompt(team, baseTournament, { canManageAthleteRegistry: false });
    expect(prompt).not.toContain("/mês");
    expect(prompt).toContain("NÃO é o assistente de vendas");
  });
});

describe("isPlatformOwner", () => {
  const original = process.env.PLATFORM_OWNER_EMAIL;

  beforeEach(() => {
    process.env.PLATFORM_OWNER_EMAIL = "dono@digitalmoney.com";
  });

  afterEach(() => {
    process.env.PLATFORM_OWNER_EMAIL = original;
  });

  it("matches the configured owner email case-insensitively", () => {
    expect(isPlatformOwner("Dono@DigitalMoney.com")).toBe(true);
  });

  it("rejects any other organizer's email", () => {
    expect(isPlatformOwner("organizador@exemplo.com")).toBe(false);
  });

  it("rejects when no email is given", () => {
    expect(isPlatformOwner(null)).toBe(false);
    expect(isPlatformOwner(undefined)).toBe(false);
  });

  it("never matches anyone if PLATFORM_OWNER_EMAIL isn't configured", () => {
    delete process.env.PLATFORM_OWNER_EMAIL;
    expect(isPlatformOwner("dono@digitalmoney.com")).toBe(false);
  });
});
