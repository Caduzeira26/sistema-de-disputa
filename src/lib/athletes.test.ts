import { describe, expect, it } from "vitest";
import { isTransferWindowOpen, isValidDocumentFormat, normalizeDocument } from "./athletes";

describe("isTransferWindowOpen", () => {
  it("is always open when no deadline is configured", () => {
    expect(isTransferWindowOpen({ transferDeadline: null }, new Date("2099-01-01"))).toBe(true);
  });

  it("is open strictly before the deadline", () => {
    const tournament = { transferDeadline: new Date("2026-09-20T00:00:00Z") };
    expect(isTransferWindowOpen(tournament, new Date("2026-09-19T00:00:00Z"))).toBe(true);
  });

  it("is closed at or after the deadline", () => {
    const tournament = { transferDeadline: new Date("2026-09-20T00:00:00Z") };
    expect(isTransferWindowOpen(tournament, new Date("2026-09-20T00:00:00Z"))).toBe(false);
    expect(isTransferWindowOpen(tournament, new Date("2026-09-21T00:00:00Z"))).toBe(false);
  });
});

describe("normalizeDocument", () => {
  it("strips punctuation from a formatted CPF", () => {
    expect(normalizeDocument("123.456.789-01")).toBe("12345678901");
  });

  it("leaves already-clean digits untouched", () => {
    expect(normalizeDocument("12345678901")).toBe("12345678901");
  });
});

describe("isValidDocumentFormat", () => {
  it("accepts an 11-digit CPF, formatted or not", () => {
    expect(isValidDocumentFormat("123.456.789-01")).toBe(true);
    expect(isValidDocumentFormat("12345678901")).toBe(true);
  });

  it("rejects anything without exactly 11 digits", () => {
    expect(isValidDocumentFormat("123")).toBe(false);
    expect(isValidDocumentFormat("")).toBe(false);
  });
});
