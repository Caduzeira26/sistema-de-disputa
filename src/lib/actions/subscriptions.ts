"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createSubscriptionCharge } from "@/lib/pix";
import { EfiNotConfiguredError } from "@/lib/efi";
import { PLAN_CATALOG } from "@/lib/plans";
import { isAsaasConfigured } from "@/lib/asaas";
import { CheckoutInputError, startGatewayCheckout } from "@/lib/gatewayPayments";

const checkoutSchema = z
  .object({
    plan: z.enum(["START", "PRO", "LIGA"]),
    paymentType: z.enum(["MONTHLY", "PER_TOURNAMENT"]),
  })
  .refine((d) => d.paymentType !== "PER_TOURNAMENT" || d.plan === "START", {
    message: "A compra avulsa só está disponível no plano Start.",
    path: ["paymentType"],
  });

export type StartCheckoutState = {
  error?: string;
  /** Asaas needs the buyer's CPF/CNPJ; the form reveals the field and asks again. */
  needsDocument?: boolean;
};

export async function startCheckout(_prevState: StartCheckoutState, formData: FormData): Promise<StartCheckoutState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Faça login ou crie uma conta para assinar um plano." };
  }

  const parsed = checkoutSchema.safeParse({
    plan: formData.get("plan"),
    paymentType: formData.get("paymentType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const catalogEntry = PLAN_CATALOG[parsed.data.plan];
  if (parsed.data.paymentType === "PER_TOURNAMENT" && !catalogEntry.priceAvulsoCents) {
    return { error: "Esse plano não tem opção avulsa." };
  }

  // PIX, boleto, credit and debit card through Asaas when it's configured; the Efí PIX path below is the fallback.
  if (isAsaasConfigured()) {
    let gatewayPaymentId: string;
    try {
      const result = await startGatewayCheckout({
        userId: session.user.id,
        plan: parsed.data.plan,
        paymentType: parsed.data.paymentType,
        cpfCnpjInput: (formData.get("cpfCnpj") as string | null) ?? null,
      });
      if (result.needsDocument) return { needsDocument: true };
      gatewayPaymentId = result.gatewayPaymentId;
    } catch (err) {
      if (err instanceof CheckoutInputError) return { needsDocument: true, error: err.message };
      console.error("[checkout] could not create the Asaas charge", err);
      return { error: "Não foi possível gerar a cobrança agora. Tente novamente em instantes." };
    }
    redirect(`/admin/assinatura/cobranca/${gatewayPaymentId}`);
  }

  const subscription = await prisma.subscription.create({
    data: { userId: session.user.id, plan: parsed.data.plan, paymentType: parsed.data.paymentType, status: "PENDING" },
  });

  let txid: string;
  try {
    const charge = await createSubscriptionCharge(subscription.id);
    txid = charge.txid;
  } catch (err) {
    const message =
      err instanceof EfiNotConfiguredError
        ? "Pagamento por PIX indisponível no momento. Tente novamente mais tarde."
        : "Não foi possível gerar a cobrança PIX. Tente novamente.";
    return { error: message };
  }

  redirect(`/admin/assinatura/pagamento/${txid}`);
}
