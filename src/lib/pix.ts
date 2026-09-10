import { prisma } from "@/lib/db";
import * as efi from "@/lib/efi";
import { PLAN_CATALOG } from "@/lib/plans";
import type { PaymentType, PixTransactionStatus } from "@prisma/client";

/** Our commission per paid team registration, in cents — on top of the organizer's own fee. */
export const PLATFORM_FEE_CENTS = 200;

/** Idempotency guard: once PAID, a transaction never needs (or should) settle again. */
export function shouldSettle(currentStatus: PixTransactionStatus, efiStatus: string): boolean {
  if (currentStatus === "PAID") return false;
  return efiStatus === "CONCLUIDA";
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Pure so the "how long does a paid subscription last" rule is unit-testable. */
export function computeSubscriptionActivation(
  paymentType: PaymentType,
  now: Date
): { startDate: Date; endDate: Date | null } {
  return {
    startDate: now,
    // PER_TOURNAMENT (Start avulso) never expires — see prisma/schema.prisma's Subscription docs.
    endDate: paymentType === "MONTHLY" ? new Date(now.getTime() + THIRTY_DAYS_MS) : null,
  };
}

async function createChargeAndPersist(params: {
  amountCents: number;
  platformFeeCents: number;
  description: string;
  data: {
    kind: "TEAM_REGISTRATION" | "SUBSCRIPTION";
    tournamentId?: string;
    teamId?: string;
    subscriptionId?: string;
  };
}) {
  const pixKey = process.env.EFI_PIX_KEY;
  if (!pixKey) throw new efi.EfiNotConfiguredError();

  const txid = efi.generateTxid();
  const cob = await efi.createCharge({ txid, amountCents: params.amountCents, description: params.description });
  if (!cob.loc) throw new Error("Efí não retornou o location da cobrança.");
  const qr = await efi.getQrCode(cob.loc.id);

  return prisma.pixTransaction.create({
    data: {
      ...params.data,
      amountCents: params.amountCents,
      platformFeeCents: params.platformFeeCents,
      txid,
      qrCode: qr.qrcode,
      qrCodeImageBase64: qr.imagemQrcode,
      locId: cob.loc.id,
    },
  });
}

export async function createTeamRegistrationCharge(teamId: string) {
  const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId }, include: { tournament: true } });
  const feeCents = team.tournament.registrationFeeCents ?? 0;
  const amountCents = feeCents + PLATFORM_FEE_CENTS;

  return createChargeAndPersist({
    amountCents,
    platformFeeCents: PLATFORM_FEE_CENTS,
    description: `Inscrição ${team.name} — ${team.tournament.name}`.slice(0, 140),
    data: { kind: "TEAM_REGISTRATION", tournamentId: team.tournamentId, teamId: team.id },
  });
}

export async function createSubscriptionCharge(subscriptionId: string) {
  const subscription = await prisma.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
  const catalogEntry = PLAN_CATALOG[subscription.plan];
  const amountCents =
    subscription.paymentType === "PER_TOURNAMENT"
      ? (catalogEntry.priceAvulsoCents ?? catalogEntry.priceMonthlyCents)
      : catalogEntry.priceMonthlyCents;

  return createChargeAndPersist({
    amountCents,
    platformFeeCents: 0,
    description: `Assinatura ${catalogEntry.label} — Sistema de Disputa`,
    data: { kind: "SUBSCRIPTION", subscriptionId: subscription.id },
  });
}

/**
 * Re-confirms a charge directly with Efí (never trusts a webhook body alone)
 * and, only if truly paid, settles it: marks the PixTransaction PAID and
 * unlocks whatever it paid for (team approval / subscription activation).
 * Safe to call more than once for the same txid — Efí retries webhooks.
 */
export async function confirmAndSettleTransaction(txid: string, now = new Date()): Promise<void> {
  const transaction = await prisma.pixTransaction.findUnique({ where: { txid } });
  if (!transaction) return;
  if (transaction.status === "PAID") return; // already settled, nothing to do

  const cob = await efi.getCharge(txid);
  if (!shouldSettle(transaction.status, cob.status)) return;

  await prisma.$transaction(async (tx) => {
    await tx.pixTransaction.update({ where: { id: transaction.id }, data: { status: "PAID", paidAt: now } });

    if (transaction.kind === "TEAM_REGISTRATION" && transaction.teamId) {
      await tx.team.update({ where: { id: transaction.teamId }, data: { status: "APPROVED" } });
    }

    if (transaction.kind === "SUBSCRIPTION" && transaction.subscriptionId) {
      const subscription = await tx.subscription.findUniqueOrThrow({ where: { id: transaction.subscriptionId } });
      const { startDate, endDate } = computeSubscriptionActivation(subscription.paymentType, now);
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { status: "ACTIVE", startDate, endDate },
      });
    }
  });
}
