"use server";

import { prisma } from "@/lib/db";
import { confirmAndSettleTransaction } from "@/lib/pix";

/**
 * Re-checks a charge against Efí and settles it if paid (idempotent — see
 * confirmAndSettleTransaction). Called from the payment pages' "Já paguei"
 * button instead of polling, keeping the client simple.
 */
export async function checkPixPaymentStatus(txid: string): Promise<{ status: string }> {
  try {
    await confirmAndSettleTransaction(txid);
  } catch {
    // Efí unreachable or not configured — report whatever we already know.
  }
  const transaction = await prisma.pixTransaction.findUnique({ where: { txid }, select: { status: true } });
  return { status: transaction?.status ?? "PENDING" };
}
