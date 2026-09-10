import { describe, expect, it } from "vitest";
import { buildCobPayload, generateTxid, resolveEfiHost } from "./efi";

describe("resolveEfiHost", () => {
  it("uses the production host when EFI_ENV=production", () => {
    expect(resolveEfiHost("production")).toBe("pix.api.efipay.com.br");
  });

  it("defaults to the sandbox host otherwise", () => {
    expect(resolveEfiHost("sandbox")).toBe("pix-h.api.efipay.com.br");
    expect(resolveEfiHost(undefined)).toBe("pix-h.api.efipay.com.br");
  });
});

describe("buildCobPayload", () => {
  it("converts integer cents to a decimal string only at the network boundary", () => {
    const payload = buildCobPayload({ amountCents: 2990, pixKey: "chave@exemplo.com", description: "Inscrição" });
    expect(payload.valor.original).toBe("29.90");
    expect(payload.chave).toBe("chave@exemplo.com");
  });

  it("avoids float artifacts for whole-real amounts", () => {
    expect(buildCobPayload({ amountCents: 19700, pixKey: "x", description: "d" }).valor.original).toBe("197.00");
  });

  it("truncates an overly long payer message to Efí's 140-char limit", () => {
    const longDescription = "x".repeat(200);
    const payload = buildCobPayload({ amountCents: 100, pixKey: "x", description: longDescription });
    expect(payload.solicitacaoPagador.length).toBe(140);
  });
});

describe("generateTxid", () => {
  it("generates a txid within Efí's 26-35 char alphanumeric requirement", () => {
    const txid = generateTxid();
    expect(txid).toMatch(/^[a-z0-9]{26,35}$/);
  });

  it("generates distinct ids across calls", () => {
    expect(generateTxid()).not.toBe(generateTxid());
  });
});
