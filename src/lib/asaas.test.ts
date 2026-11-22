import { describe, expect, it } from "vitest";
import {
  AsaasApiError,
  AsaasNotConfiguredError,
  createAsaasClient,
  dueDateInBrazil,
  decideSettlement,
  isAsaasConfigured,
  parseWebhookBody,
  planTransition,
  resolveAsaasBaseUrl,
  verifyWebhookToken,
} from "./asaas";

describe("decideSettlement", () => {
  it("unlocks a boleto only once the money is credited (RECEIVED), not at CONFIRMED", () => {
    expect(decideSettlement({ status: "CONFIRMED", billingType: "BOLETO" })).toBe("PENDING");
    expect(decideSettlement({ status: "RECEIVED", billingType: "BOLETO" })).toBe("PAID");
    expect(decideSettlement({ status: "PENDING", billingType: "BOLETO" })).toBe("PENDING");
  });

  it("unlocks PIX on RECEIVED", () => {
    expect(decideSettlement({ status: "RECEIVED", billingType: "PIX" })).toBe("PAID");
    expect(decideSettlement({ status: "PENDING", billingType: "PIX" })).toBe("PENDING");
  });

  it("unlocks credit and debit cards when the payment is approved (CONFIRMED)", () => {
    expect(decideSettlement({ status: "CONFIRMED", billingType: "CREDIT_CARD" })).toBe("PAID");
    expect(decideSettlement({ status: "CONFIRMED", billingType: "DEBIT_CARD" })).toBe("PAID");
  });

  it("keeps a card that is under risk analysis pending", () => {
    expect(decideSettlement({ status: "AWAITING_RISK_ANALYSIS", billingType: "CREDIT_CARD" })).toBe("PENDING");
    expect(decideSettlement({ status: "AUTHORIZED", billingType: "CREDIT_CARD" })).toBe("PENDING");
  });

  it("treats a method that is still undefined (customer hasn't chosen) as pending even when CONFIRMED", () => {
    expect(decideSettlement({ status: "CONFIRMED", billingType: "UNDEFINED" })).toBe("PENDING");
    expect(decideSettlement({ status: "CONFIRMED", billingType: null })).toBe("PENDING");
  });

  it("revokes on refund and chargeback, and marks overdue / canceled", () => {
    expect(decideSettlement({ status: "REFUNDED", billingType: "PIX" })).toBe("REFUNDED");
    expect(decideSettlement({ status: "CHARGEBACK_REQUESTED", billingType: "CREDIT_CARD" })).toBe("CHARGEBACK");
    expect(decideSettlement({ status: "OVERDUE", billingType: "BOLETO" })).toBe("OVERDUE");
    expect(decideSettlement({ status: "REPROVED_BY_RISK_ANALYSIS", billingType: "CREDIT_CARD" })).toBe("CANCELED");
    expect(decideSettlement({ status: "PENDING", billingType: "BOLETO", deleted: true })).toBe("CANCELED");
  });

  it("never unlocks on a partial refund or an unknown status (the service also never downgrades a PAID charge for these)", () => {
    expect(decideSettlement({ status: "PARTIALLY_REFUNDED", billingType: "PIX" })).toBe("PENDING");
    expect(decideSettlement({ status: "SOMETHING_NEW", billingType: "PIX" })).toBe("PENDING");
  });
});

describe("configuration", () => {
  it("is configured only with an API key", () => {
    expect(isAsaasConfigured({})).toBe(false);
    expect(isAsaasConfigured({ ASAAS_API_KEY: "$aact_prod_x" })).toBe(true);
  });

  it("picks sandbox for a sandbox key or ASAAS_ENV, production otherwise, and honors an override", () => {
    expect(resolveAsaasBaseUrl({ ASAAS_API_KEY: "$aact_hmlg_abc" })).toBe("https://api-sandbox.asaas.com/v3");
    expect(resolveAsaasBaseUrl({ ASAAS_API_KEY: "$aact_prod_abc", ASAAS_ENV: "sandbox" })).toBe("https://api-sandbox.asaas.com/v3");
    expect(resolveAsaasBaseUrl({ ASAAS_API_KEY: "$aact_prod_abc" })).toBe("https://api.asaas.com/v3");
    expect(resolveAsaasBaseUrl({ ASAAS_API_URL: "http://localhost:4010/v3/" })).toBe("http://localhost:4010/v3");
  });

  it("refuses to build a client without a key", () => {
    expect(() => createAsaasClient({ apiKey: "" , baseUrl: "http://x" })).toThrow(AsaasNotConfiguredError);
  });
});

describe("createAsaasClient", () => {
  function fakeFetch(responses: { ok: boolean; status: number; json: unknown }[]) {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const next = responses.shift()!;
      return { ok: next.ok, status: next.status, json: async () => next.json } as Response;
    };
    return { calls, fetchImpl };
  }

  it("creates an UNDEFINED-method charge, in reais, with the auth and User-Agent headers", async () => {
    const { calls, fetchImpl } = fakeFetch([
      { ok: true, status: 200, json: { id: "pay_1", status: "PENDING", billingType: "UNDEFINED", value: 29.9, dueDate: "2026-11-25", invoiceUrl: "https://asaas.test/i/1" } },
    ]);
    const client = createAsaasClient({ apiKey: "k", baseUrl: "https://api.test/v3", fetchImpl });
    const payment = await client.createPayment({
      customer: "cus_1",
      valueCents: 2990,
      dueDate: "2026-11-25",
      description: "Assinatura Start",
      externalReference: "sub_1",
    });

    expect(payment.invoiceUrl).toBe("https://asaas.test/i/1");
    expect(calls[0].url).toBe("https://api.test/v3/payments");
    expect(calls[0].init.method).toBe("POST");
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.access_token).toBe("k");
    expect(headers["User-Agent"]).toMatch(/SistemaDeDisputa/);
    expect(JSON.parse(calls[0].init.body as string)).toEqual({
      customer: "cus_1",
      billingType: "UNDEFINED",
      value: 29.9,
      dueDate: "2026-11-25",
      description: "Assinatura Start",
      externalReference: "sub_1",
    });
  });

  it("looks a customer up by CPF/CNPJ and returns null when there is none", async () => {
    const { calls, fetchImpl } = fakeFetch([{ ok: true, status: 200, json: { data: [] } }]);
    const client = createAsaasClient({ apiKey: "k", baseUrl: "https://api.test/v3", fetchImpl });
    expect(await client.findCustomerByCpfCnpj("52998224725")).toBeNull();
    expect(calls[0].url).toBe("https://api.test/v3/customers?cpfCnpj=52998224725");
  });

  it("turns an Asaas error body into an AsaasApiError with its description", async () => {
    const { fetchImpl } = fakeFetch([
      { ok: false, status: 400, json: { errors: [{ code: "invalid_customer", description: "CPF inválido" }] } },
    ]);
    const client = createAsaasClient({ apiKey: "k", baseUrl: "https://api.test/v3", fetchImpl });
    const error = await client.getPayment("pay_1").catch((e) => e);
    expect(error).toBeInstanceOf(AsaasApiError);
    expect(error.message).toContain("CPF inválido");
    expect(error.status).toBe(400);
  });
});

describe("webhook helpers", () => {
  it("verifies the access token and rejects a missing or wrong one", () => {
    expect(verifyWebhookToken("secret-token", "secret-token")).toBe(true);
    expect(verifyWebhookToken("other", "secret-token")).toBe(false);
    expect(verifyWebhookToken(null, "secret-token")).toBe(false);
    expect(verifyWebhookToken("anything", "")).toBe(false);
    expect(verifyWebhookToken("anything", undefined)).toBe(false);
  });

  it("parses payment events and ignores everything else", () => {
    expect(parseWebhookBody({ event: "PAYMENT_RECEIVED", payment: { id: "pay_1" } })).toEqual({ event: "PAYMENT_RECEIVED", paymentId: "pay_1" });
    expect(parseWebhookBody({ event: "TRANSFER_DONE", payment: { id: "pay_1" } })).toBeNull();
    expect(parseWebhookBody({ event: "PAYMENT_RECEIVED" })).toBeNull();
    expect(parseWebhookBody("nope")).toBeNull();
    expect(parseWebhookBody(null)).toBeNull();
  });
});

describe("dueDateInBrazil", () => {
  it("formats as YYYY-MM-DD in São Paulo time", () => {
    // 2026-11-23 01:00 UTC is still 2026-11-22 in Brazil (UTC-3)
    expect(dueDateInBrazil(new Date("2026-11-23T01:00:00Z"), 0)).toBe("2026-11-22");
    expect(dueDateInBrazil(new Date("2026-11-23T01:00:00Z"), 3)).toBe("2026-11-25");
  });
});

describe('planTransition', () => {
  it('activates exactly once when a pending charge becomes paid', () => {
    expect(planTransition('PENDING', 'PAID')).toEqual({ next: 'PAID', activate: true, revoke: false });
    expect(planTransition('OVERDUE', 'PAID')).toEqual({ next: 'PAID', activate: true, revoke: false });
    expect(planTransition('PAID', 'PAID')).toEqual({ next: 'PAID', activate: false, revoke: false });
  });

  it('revokes a paid charge on refund or chargeback, but only once', () => {
    expect(planTransition('PAID', 'REFUNDED')).toEqual({ next: 'REFUNDED', activate: false, revoke: true });
    expect(planTransition('PAID', 'CHARGEBACK')).toEqual({ next: 'CHARGEBACK', activate: false, revoke: true });
    expect(planTransition('REFUNDED', 'CHARGEBACK')).toEqual({ next: 'CHARGEBACK', activate: false, revoke: false });
  });

  it('does not revoke when an unpaid charge is canceled', () => {
    expect(planTransition('PENDING', 'CANCELED')).toEqual({ next: 'CANCELED', activate: false, revoke: false });
  });

  it('only marks a pending charge overdue and never downgrades a paid one', () => {
    expect(planTransition('PENDING', 'OVERDUE').next).toBe('OVERDUE');
    expect(planTransition('PAID', 'OVERDUE').next).toBe('PAID');
    expect(planTransition('PAID', 'PENDING').next).toBe('PAID');
    expect(planTransition('OVERDUE', 'PENDING').next).toBe('OVERDUE');
  });
});
