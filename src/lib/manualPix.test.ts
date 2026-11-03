import { describe, expect, it } from "vitest";
import { manualPixFromTournament, manualPixSchema, parseReaisToCents } from "./manualPix";

describe("parseReaisToCents", () => {
  it("parses plain and comma amounts", () => {
    expect(parseReaisToCents("25")).toBe(2500);
    expect(parseReaisToCents("25,5")).toBe(2550);
    expect(parseReaisToCents("25,50")).toBe(2550);
    expect(parseReaisToCents("25.50")).toBe(2550);
  });

  it("accepts the R$ prefix and thousands separators", () => {
    expect(parseReaisToCents("R$ 1.250,00")).toBe(125000);
    expect(parseReaisToCents("1.250")).toBe(125000);
    expect(parseReaisToCents("R$30")).toBe(3000);
  });

  it("treats empty input as no amount", () => {
    expect(parseReaisToCents("")).toBeNull();
    expect(parseReaisToCents("   ")).toBeNull();
    expect(parseReaisToCents(undefined)).toBeNull();
  });

  it("rejects invalid amounts", () => {
    expect(parseReaisToCents("abc")).toBeUndefined();
    expect(parseReaisToCents("-5")).toBeUndefined();
    expect(parseReaisToCents("1,234")).toBeUndefined();
  });
});

describe("manualPixSchema", () => {
  it("trims the key and holder", () => {
    const parsed = manualPixSchema.parse({ key: "  12345678900  ", holder: "  Maria  ", amount: "" });
    expect(parsed.key).toBe("12345678900");
    expect(parsed.holder).toBe("Maria");
  });

  it("rejects a key over the limit", () => {
    expect(manualPixSchema.safeParse({ key: "x".repeat(301), holder: "" }).success).toBe(false);
  });
});

describe("manualPixFromTournament", () => {
  it("returns null without a key", () => {
    expect(manualPixFromTournament({ manualPixKey: null, manualPixHolder: "A", manualPixAmountCents: 100 })).toBeNull();
  });

  it("falls back to the registration fee when no manual amount is set", () => {
    expect(
      manualPixFromTournament({ manualPixKey: "a@b.com", manualPixHolder: null, manualPixAmountCents: null, registrationFeeCents: 2000 })
    ).toEqual({ key: "a@b.com", holder: null, amountCents: 2000 });
  });

  it("prefers the manual amount over the registration fee", () => {
    expect(
      manualPixFromTournament({ manualPixKey: "a@b.com", manualPixHolder: null, manualPixAmountCents: 1500, registrationFeeCents: 2000 })
        ?.amountCents
    ).toBe(1500);
  });

  it("returns the settings when a key is set", () => {
    expect(manualPixFromTournament({ manualPixKey: "a@b.com", manualPixHolder: null, manualPixAmountCents: 3000 })).toEqual({
      key: "a@b.com",
      holder: null,
      amountCents: 3000,
    });
  });
});
