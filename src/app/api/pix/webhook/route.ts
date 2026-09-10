import { NextResponse } from "next/server";
import { confirmAndSettleTransaction } from "@/lib/pix";

// mTLS (node:https with a client certificate) needs the Node runtime, not Edge.
export const runtime = "nodejs";

type EfiWebhookBody = {
  pix?: { txid?: string }[];
};

/**
 * Efí notifies us when a PIX charge is paid. We never trust this body as
 * proof of payment — it's only a hint telling us which txid to re-check
 * directly with Efí (see confirmAndSettleTransaction). Always answer 200
 * once we've processed what we can, so Efí stops retrying; only a genuine
 * unexpected failure should surface as a 500.
 */
export async function POST(request: Request) {
  let body: EfiWebhookBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true }); // malformed body — nothing to retry for
  }

  const txids = (body.pix ?? []).map((p) => p.txid).filter((txid): txid is string => Boolean(txid));

  try {
    await Promise.all(txids.map((txid) => confirmAndSettleTransaction(txid)));
  } catch (err) {
    console.error("[pix webhook] failed to settle transaction(s)", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
