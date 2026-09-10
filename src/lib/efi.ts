import https from "node:https";
import { randomBytes } from "node:crypto";

/**
 * Raw HTTP client for the Efí Bank (Gerencianet) Pix API. No business logic
 * here — src/lib/pix.ts owns what a charge/settlement *means*; this file
 * only knows how to talk to Efí's servers (OAuth + mTLS + the 3 endpoints
 * we use). Mirrors src/lib/storage.ts's env-var-gated philosophy: missing
 * credentials throw a distinguishable error instead of crashing callers
 * that don't need PIX (free tournaments/teams keep working either way).
 */

export class EfiNotConfiguredError extends Error {
  constructor() {
    super("Efí não está configurada (variáveis EFI_* ausentes).");
    this.name = "EfiNotConfiguredError";
  }
}

class EfiApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown
  ) {
    super(message);
    this.name = "EfiApiError";
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new EfiNotConfiguredError();
  return value;
}

/** Pure so it's unit-testable without touching process.env or the network. */
export function resolveEfiHost(env: string | undefined): string {
  return env === "production" ? "pix.api.efipay.com.br" : "pix-h.api.efipay.com.br";
}

function getBaseHost(): string {
  return resolveEfiHost(process.env.EFI_ENV);
}

let cachedAgent: https.Agent | null = null;

function getHttpsAgent(): https.Agent {
  if (cachedAgent) return cachedAgent;
  const certBase64 = requiredEnv("EFI_CERT_BASE64");
  const pfx = Buffer.from(certBase64, "base64");
  cachedAgent = new https.Agent({ pfx, passphrase: process.env.EFI_CERT_PASSPHRASE || undefined });
  return cachedAgent;
}

function httpsRequestJson<T>(options: {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<T> {
  return new Promise((resolve, reject) => {
    const payload = options.body !== undefined ? JSON.stringify(options.body) : undefined;
    const req = https.request(
      {
        host: getBaseHost(),
        path: options.path,
        method: options.method,
        agent: getHttpsAgent(),
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf-8");
          let parsed: unknown = undefined;
          try {
            parsed = raw ? JSON.parse(raw) : undefined;
          } catch {
            // non-JSON body; fall through with parsed === undefined
          }
          const status = res.statusCode ?? 0;
          if (status >= 200 && status < 300) {
            resolve(parsed as T);
          } else {
            reject(new EfiApiError(`Efí retornou status ${status}`, status, parsed ?? raw));
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

type TokenCache = { accessToken: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.accessToken;
  }

  const clientId = requiredEnv("EFI_CLIENT_ID");
  const clientSecret = requiredEnv("EFI_CLIENT_SECRET");
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await httpsRequestJson<{ access_token: string; expires_in: number }>({
    method: "POST",
    path: "/oauth/token",
    headers: { Authorization: `Basic ${basicAuth}` },
    body: { grant_type: "client_credentials" },
  });

  tokenCache = { accessToken: res.access_token, expiresAt: now + res.expires_in * 1000 };
  return res.access_token;
}

async function authedRequest<T>(options: { method: string; path: string; body?: unknown }): Promise<T> {
  const token = await getAccessToken();
  return httpsRequestJson<T>({
    ...options,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type EfiCobResponse = {
  txid: string;
  status: string;
  loc?: { id: number; location: string };
  pix?: { valor: string; horario: string; endToEndId: string }[];
};

/**
 * Pure payload builder — the only place a cents→decimal-string conversion
 * happens, and only for network serialization (never earlier in the call
 * chain, to keep every amount an integer-cents `Int` until this boundary).
 */
export function buildCobPayload(params: { amountCents: number; pixKey: string; description: string }) {
  return {
    calendario: { expiracao: 3600 },
    valor: { original: (params.amountCents / 100).toFixed(2) },
    chave: params.pixKey,
    solicitacaoPagador: params.description.slice(0, 140),
  };
}

/** Creates (or overwrites, if already pending) an immediate PIX charge for the given txid. */
export function createCharge(params: { txid: string; amountCents: number; description: string }): Promise<EfiCobResponse> {
  const pixKey = requiredEnv("EFI_PIX_KEY");
  return authedRequest<EfiCobResponse>({
    method: "PUT",
    path: `/v2/cob/${encodeURIComponent(params.txid)}`,
    body: buildCobPayload({ amountCents: params.amountCents, pixKey, description: params.description }),
  });
}

/** Re-fetches a charge's current status directly from Efí — never trust a webhook body alone. */
export function getCharge(txid: string): Promise<EfiCobResponse> {
  return authedRequest<EfiCobResponse>({ method: "GET", path: `/v2/cob/${encodeURIComponent(txid)}` });
}

export type EfiQrCodeResponse = { qrcode: string; imagemQrcode: string };

export function getQrCode(locId: number): Promise<EfiQrCodeResponse> {
  return authedRequest<EfiQrCodeResponse>({ method: "GET", path: `/v2/loc/${locId}/qrcode` });
}

/** Efí requires a 26-35 char alphanumeric txid, chosen by us (not Efí) since we PUT to /v2/cob/:txid. */
export function generateTxid(): string {
  return randomBytes(16).toString("hex"); // 32 hex chars
}
