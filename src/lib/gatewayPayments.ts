import type { GatewayPaymentStatus, PaymentType, PlanTier } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAsaasClient, decideSettlement, dueDateInBrazil, planTransition } from "@/lib/asaas";
import { computeSubscriptionActivation } from "@/lib/pix";
import { PLAN_CATALOG, getSubscriptionPriceCents } from "@/lib/plans";
import { normalizeCpfCnpj } from "@/lib/document";

/** Days a boleto stays payable. PIX and cards are paid right away, so this only matters for boletos. */
const DUE_DAYS = 3;

export class CheckoutInputError extends Error {}

/**
 * Creates the Asaas charge for a plan purchase. Returns `needsDocument` when the
 * organizer has no CPF/CNPJ on file and none was given (Asaas requires one).
 */
export async function startGatewayCheckout(params: {
  userId: string;
  plan: PlanTier;
  paymentType: PaymentType;
  cpfCnpjInput?: string | null;
  now?: Date;
}): Promise<{ needsDocument: true } | { needsDocument: false; gatewayPaymentId: string }> {
  const now = params.now ?? new Date();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });

  const typed = params.cpfCnpjInput?.trim();
  let cpfCnpj = user.cpfCnpj;
  if (typed) {
    const normalized = normalizeCpfCnpj(typed);
    if (!normalized) throw new CheckoutInputError("CPF ou CNPJ inválido. Confira os números.");
    cpfCnpj = normalized;
  }
  if (!cpfCnpj) return { needsDocument: true };

  const client = createAsaasClient();

  let customerId = user.cpfCnpj === cpfCnpj ? user.asaasCustomerId : null;
  if (!customerId) {
    const existing = await client.findCustomerByCpfCnpj(cpfCnpj);
    const customer = existing ?? (await client.createCustomer({ name: user.name, email: user.email, cpfCnpj, externalReference: user.id }));
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { cpfCnpj, asaasCustomerId: customerId } });
  }

  const amountCents = getSubscriptionPriceCents(params.plan, params.paymentType, now);
  const subscription = await prisma.subscription.create({
    data: { userId: user.id, plan: params.plan, paymentType: params.paymentType, status: "PENDING" },
  });

  try {
    const payment = await client.createPayment({
      customer: customerId,
      valueCents: amountCents,
      dueDate: dueDateInBrazil(now, DUE_DAYS),
      description: `Assinatura ${PLAN_CATALOG[params.plan].label} — Sistema de Disputa`,
      externalReference: subscription.id,
    });

    const row = await prisma.gatewayPayment.create({
      data: {
        subscriptionId: subscription.id,
        gatewayId: payment.id,
        amountCents,
        status: "PENDING",
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl ?? null,
        dueDate: new Date(`${payment.dueDate}T12:00:00-03:00`),
      },
    });
    return { needsDocument: false, gatewayPaymentId: row.id };
  } catch (error) {
    // Don't leave a PENDING subscription behind when no charge exists for it.
    await prisma.subscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
    throw error;
  }
}

/**
 * Re-reads the charge from Asaas (never trusting a webhook body) and applies the
 * result: unlock the plan once it counts as paid, take it back on refund or
 * chargeback. Safe to call any number of times for the same charge.
 * Returns the stored status, or null when the charge isn't one of ours.
 */
export async function syncGatewayPayment(gatewayId: string, now = new Date()): Promise<GatewayPaymentStatus | null> {
  const row = await prisma.gatewayPayment.findUnique({ where: { gatewayId }, include: { subscription: true } });
  if (!row) return null;

  const remote = await createAsaasClient().getPayment(gatewayId);
  const transition = planTransition(row.status, decideSettlement(remote));
  const billingType = remote.billingType && remote.billingType !== "UNDEFINED" ? remote.billingType : row.billingType;

  if (transition.activate) {
    await prisma.$transaction(async (tx) => {
      // The status guard makes a duplicate webhook (or a poll racing a webhook) a no-op.
      const claimed = await tx.gatewayPayment.updateMany({
        where: { id: row.id, status: { not: "PAID" } },
        data: { status: "PAID", paidAt: now, billingType },
      });
      if (claimed.count === 0) return;
      const { startDate, endDate } = computeSubscriptionActivation(row.subscription.paymentType, now);
      await tx.subscription.update({ where: { id: row.subscriptionId }, data: { status: "ACTIVE", startDate, endDate } });
    });
    return "PAID";
  }

  if (transition.revoke) {
    await prisma.$transaction([
      prisma.gatewayPayment.update({ where: { id: row.id }, data: { status: transition.next, billingType } }),
      prisma.subscription.update({ where: { id: row.subscriptionId }, data: { status: "CANCELED", endDate: now } }),
    ]);
    return transition.next;
  }

  if (transition.next !== row.status || billingType !== row.billingType) {
    await prisma.gatewayPayment.update({ where: { id: row.id }, data: { status: transition.next, billingType } });
  }
  return transition.next;
}
