import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Asaas (PIX, boleto, credit and debit card). Charges are created with
 * billingType UNDEFINED and the customer pays on Asaas's hosted page (invoiceUrl),
 * so card data never reaches this app. Nothing here touches the database.
 */

export class AsaasNotConfiguredError extends Error {
  constructor() {
    super("Asaas não configurado (ASAAS_API_KEY ausente).");
    this.name = "AsaasNotConfiguredError";
  }
}

export class AsaasApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AsaasApiError";
  }
}

const SANDBOX_URL = "https://api-sandbox.asaas.com/v3";
const PRODUCTION_URL = "https://api.asaas.com/v3";
/** Asaas requires a descriptive User-Agent on accounts created after 2024-06-13. */
const USER_AGENT = "SistemaDeDisputa/1.0";

type Env = Record<string, string | undefined>;

export function isAsaasConfigured(env: Env = process.env): boolean {
  return Boolean(env.ASAAS_API_KEY);
}

/**
 * Sandbox keys start with $aact_hmlg_, production keys with $aact_prod_.
 * ASAAS_API_URL overrides everything (used to point tests at a local fake).
 */
export function resolveAsaasBaseUrl(env: Env = process.env): string {
  if (env.ASAAS_API_URL) return env.ASAAS_API_URL.replace(/\/$/, "");
  const sandbox = env.ASAAS_ENV === "sandbox" || (env.ASAAS_API_KEY ?? "").startsWith("$aact_hmlg_");
  return sandbox ? SANDBOX_URL : PRODUCTION_URL;
}

export type AsaasPayment = {
  id: string;
  status: string;
  billingType: string;
  value: number;
  dueDate: string;
  invoiceUrl: string;
  bankSlipUrl?: string | null;
  externalReference?: string | null;
  deleted?: boolean;
};

export type AsaasCustomer = { id: string; name: string; cpfCnpj: string };

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export function createAsaasClient(options?: { apiKey?: string; baseUrl?: string; fetchImpl?: FetchLike }) {
  const apiKey = options?.apiKey ?? process.env.ASAAS_API_KEY;
  if (!apiKey) throw new AsaasNotConfiguredError();
  const baseUrl = options?.baseUrl ?? resolveAsaasBaseUrl();
  const fetchImpl: FetchLike = options?.fetchImpl ?? ((url, init) => fetch(url, init));

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: {
        access_token: apiKey!,
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const json = (await response.json()) as { errors?: { description?: string }[] };
        const description = json.errors?.map((e) => e.description).filter(Boolean).join("; ");
        if (description) detail = description;
      } catch {
        // body wasn't JSON; keep the status
      }
      throw new AsaasApiError(`Asaas: ${detail}`, response.status);
    }
    return (await response.json()) as T;
  }

  return {
    async findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
      const result = await request<{ data: AsaasCustomer[] }>("GET", `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`);
      return result.data[0] ?? null;
    },

    createCustomer(params: { name: string; email: string; cpfCnpj: string; externalReference: string }) {
      return request<AsaasCustomer>("POST", "/customers", params);
    },

    /** UNDEFINED lets the customer choose PIX, boleto, credit or debit card on the hosted page. */
    createPayment(params: { customer: string; valueCents: number; dueDate: string; description: string; externalReference: string }) {
      return request<AsaasPayment>("POST", "/payments", {
        customer: params.customer,
        billingType: "UNDEFINED",
        value: params.valueCents / 100,
        dueDate: params.dueDate,
        description: params.description,
        externalReference: params.externalReference,
      });
    },

    getPayment(id: string) {
      return request<AsaasPayment>("GET", `/payments/${encodeURIComponent(id)}`);
    },
  };
}

export type SettlementDecision = "PAID" | "PENDING" | "OVERDUE" | "REFUNDED" | "CHARGEBACK" | "CANCELED";

const CARD_METHODS = new Set(["CREDIT_CARD", "DEBIT_CARD"]);

/**
 * What a charge, as Asaas reports it right now, means for access. The rule the
 * product asks for: a boleto (and PIX) unlocks only once the money is credited
 * (RECEIVED); a card unlocks when the payment is approved (CONFIRMED — the cash
 * only arrives 3 or 32 days later). Anything unknown stays PENDING, so access
 * is never granted by accident.
 */
export function decideSettlement(payment: { status: string; billingType?: string | null; deleted?: boolean }): SettlementDecision {
  if (payment.deleted) return "CANCELED";

  switch (payment.status) {
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
      return "PAID";
    case "CONFIRMED":
      return CARD_METHODS.has(payment.billingType ?? "") ? "PAID" : "PENDING";
    case "OVERDUE":
      return "OVERDUE";
    case "REFUNDED":
    case "REFUND_IN_PROGRESS":
      return "REFUNDED";
    case "CHARGEBACK_REQUESTED":
    case "CHARGEBACK_DISPUTE":
    case "AWAITING_CHARGEBACK_REVERSAL":
      return "CHARGEBACK";
    case "REPROVED_BY_RISK_ANALYSIS":
      return "CANCELED";
    default:
      // PENDING, AWAITING_RISK_ANALYSIS, APPROVED_BY_RISK_ANALYSIS, AUTHORIZED, PARTIALLY_REFUNDED, unknown...
      return "PENDING";
  }
}

/**
 * How a stored charge moves when Asaas reports `decision`. A PAID charge is only
 * ever taken back by a refund / chargeback / cancellation (never downgraded by a
 * late OVERDUE or "unknown" report), and unlocking happens exactly once.
 */
export function planTransition(
  current: SettlementDecision,
  decision: SettlementDecision
): { next: SettlementDecision; activate: boolean; revoke: boolean } {
  switch (decision) {
    case "PAID":
      return { next: "PAID", activate: current !== "PAID", revoke: false };
    case "REFUNDED":
    case "CHARGEBACK":
    case "CANCELED":
      return { next: decision, activate: false, revoke: current === "PAID" };
    case "OVERDUE":
      return { next: current === "PENDING" ? "OVERDUE" : current, activate: false, revoke: false };
    default:
      return { next: current, activate: false, revoke: false };
  }
}

/** YYYY-MM-DD in Brazil's time zone, `daysAhead` days from `now`. */
export function dueDateInBrazil(now: Date, daysAhead: number): string {
  const target = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(target);
}

/** Constant-time check of the `asaas-access-token` header against our secret. */
export function verifyWebhookToken(received: string | null | undefined, expected: string | null | undefined): boolean {
  if (!received || !expected) return false;
  const a = createHash("sha256").update(received).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** The bits of a webhook body we use: which charge changed. The status itself is re-read from Asaas. */
export function parseWebhookBody(body: unknown): { event: string; paymentId: string } | null {
  if (!body || typeof body !== "object") return null;
  const { event, payment } = body as { event?: unknown; payment?: { id?: unknown } };
  if (typeof event !== "string" || !event.startsWith("PAYMENT_")) return null;
  if (!payment || typeof payment.id !== "string" || !payment.id) return null;
  return { event, paymentId: payment.id };
}
