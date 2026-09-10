"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createSubscriptionCharge } from "@/lib/pix";
import { EfiNotConfiguredError } from "@/lib/efi";
import { PLAN_CATALOG } from "@/lib/plans";

const checkoutSchema = z
  .object({
    plan: z.enum(["START", "PRO", "LIGA"]),
    paymentType: z.enum(["MONTHLY", "PER_TOURNAMENT"]),
  })
  .refine((d) => d.paymentType !== "PER_TOURNAMENT" || d.plan === "START", {
    message: "A compra avulsa só está disponível no plano Start.",
    path: ["paymentType"],
  });

export type StartCheckoutState = { error?: string };

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
