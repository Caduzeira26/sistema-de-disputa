import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAsaasConfigured } from "@/lib/asaas";
import { syncGatewayPayment } from "@/lib/gatewayPayments";

export const runtime = "nodejs";

/**
 * Status of one of the signed-in organizer's plan charges. While it's still open
 * this re-checks it with Asaas first, so the page updates even if the webhook
 * hasn't been set up (or is late).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const row = await prisma.gatewayPayment.findUnique({ where: { id }, include: { subscription: true } });
  if (!row || row.subscription.userId !== session.user.id) return NextResponse.json({ error: "not found" }, { status: 404 });

  let status = row.status;
  if ((status === "PENDING" || status === "OVERDUE") && isAsaasConfigured()) {
    try {
      status = (await syncGatewayPayment(row.gatewayId)) ?? status;
    } catch (err) {
      console.error("[cobranca status] could not re-check the charge", err);
    }
  }
  return NextResponse.json({ status });
}
