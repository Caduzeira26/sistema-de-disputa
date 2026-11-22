import { NextResponse } from "next/server";
import { parseWebhookBody, verifyWebhookToken } from "@/lib/asaas";
import { syncGatewayPayment } from "@/lib/gatewayPayments";

export const runtime = "nodejs";

/**
 * Asaas calls this when a charge changes. The body is only a hint about which
 * charge to look at: we check the shared secret (`asaas-access-token`), then
 * re-read the charge from Asaas before changing anything. Answering 200 stops the
 * retries; a real failure answers 500 so Asaas tries again (it keeps events for
 * 14 days and pauses the queue after repeated failures).
 */
export async function POST(request: Request) {
  if (!verifyWebhookToken(request.headers.get("asaas-access-token"), process.env.ASAAS_WEBHOOK_TOKEN)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true }); // malformed body — nothing to retry for
  }

  const parsed = parseWebhookBody(body);
  if (!parsed) return NextResponse.json({ ok: true }); // an event we don't use

  try {
    await syncGatewayPayment(parsed.paymentId);
  } catch (err) {
    console.error("[asaas webhook] failed to sync charge", parsed.paymentId, err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
