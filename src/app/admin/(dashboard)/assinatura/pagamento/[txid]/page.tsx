import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PixPaymentPanel } from "@/components/PixPaymentPanel";
import { PLAN_CATALOG } from "@/lib/plans";

export default async function SubscriptionPaymentPage({ params }: { params: Promise<{ txid: string }> }) {
  const { txid } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const transaction = await prisma.pixTransaction.findUnique({
    where: { txid },
    include: { subscription: true },
  });
  if (!transaction || transaction.kind !== "SUBSCRIPTION" || !transaction.subscription) notFound();
  if (transaction.subscription.userId !== session.user.id) notFound();

  const planLabel = PLAN_CATALOG[transaction.subscription.plan].label;

  return (
    <div className="mx-auto w-full max-w-md">
      <Link href="/planos" className="text-sm text-slate-500 underline">
        ← Planos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Assinatura {planLabel}</h1>
      <p className="mt-1 text-sm text-slate-500">Pague o PIX abaixo para ativar seu plano.</p>

      <div className="mt-6">
        <PixPaymentPanel
          txid={transaction.txid}
          amountCents={transaction.amountCents}
          qrCode={transaction.qrCode}
          qrCodeImageBase64={transaction.qrCodeImageBase64}
          initialStatus={transaction.status}
          paidMessage={`Seu plano ${planLabel} está ativo.`}
        />
      </div>

      <Link href="/admin" className="mt-6 block text-center text-sm text-slate-500 underline">
        Ir para o painel
      </Link>
    </div>
  );
}
