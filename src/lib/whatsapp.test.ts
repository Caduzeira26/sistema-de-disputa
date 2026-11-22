import { describe, expect, it } from "vitest";
import { WHATSAPP_NUMBER, whatsappLink } from "./business";

describe("whatsappLink", () => {
  it("points at the company number with the message encoded", () => {
    const link = whatsappLink("Olá! Quero o plano Corporativo (R$ 1.200 + R$ 200/mês)");
    expect(link.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`)).toBe(true);
    expect(decodeURIComponent(link.split("?text=")[1])).toBe("Olá! Quero o plano Corporativo (R$ 1.200 + R$ 200/mês)");
  });
});

describe("WHATSAPP_NUMBER", () => {
  it("is a complete Brazilian mobile number: 55 + DDD + 9 digits", () => {
    expect(WHATSAPP_NUMBER).toBe("5543996800406");
    expect(WHATSAPP_NUMBER).toMatch(/^55\d{2}9\d{8}$/);
  });
});
