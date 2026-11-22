import { describe, expect, it } from "vitest";
import { isValidCnpj, isValidCpf, normalizeCpfCnpj, onlyDigits } from "./document";

describe("CPF", () => {
  it("accepts a valid CPF with or without punctuation", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejects wrong check digits, repeated digits and wrong length", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("5299822472")).toBe(false);
    expect(isValidCpf("43996386452")).toBe(false); // a phone number, not a CPF
  });
});

describe("CNPJ", () => {
  it("accepts a valid CNPJ with or without punctuation", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11222333000181")).toBe(true);
  });

  it("rejects wrong check digits and repeated digits", () => {
    expect(isValidCnpj("11.222.333/0001-80")).toBe(false);
    expect(isValidCnpj("00000000000000")).toBe(false);
  });
});

describe("normalizeCpfCnpj", () => {
  it("returns digits for a valid CPF or CNPJ", () => {
    expect(normalizeCpfCnpj("529.982.247-25")).toBe("52998224725");
    expect(normalizeCpfCnpj("11.222.333/0001-81")).toBe("11222333000181");
  });

  it("returns null otherwise", () => {
    expect(normalizeCpfCnpj("123")).toBeNull();
    expect(normalizeCpfCnpj("")).toBeNull();
  });

  it("onlyDigits strips everything else", () => {
    expect(onlyDigits("(43) 99638-6452")).toBe("43996386452");
  });
});
