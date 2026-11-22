import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_CATALOG, formatBRL } from "@/lib/plans";
import { GatewayPaymentWatcher } from "@/components/GatewayPaymentWatcher";

const METHOD_LABEL: Record<string, string> = {
  PIX: "PIX",
  BOLETO: "boleto",
  CREDIT_CARD: "cartão de crédito",
  DEBIT_CARD: "cartão de débito",
};

export default async function SubscriptionChargePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const payment = await prisma.gatewayPayment.findUnique({ where: { id }, include: { subscription: true } });
  if (!payment || payment.subscription.userId !== session.user.id) notFound();

  const planLabel = PLAN_CATALOG[payment.subscription.plan].label;
  const dueLabel = payment.dueDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const method = payment.billingType ? (METHOD_LABEL[payment.billingType] ?? payment.billingType) : null;

  return (
    <div className="mx-auto w-full max-w-md">
      <Link href="/planos" className="text-sm text-slate-500 underline">
        ← Planos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Assinatura {planLabel}</h1>
      <p className="mt-1 text-sm text-slate-500">Valor: {formatBRL(payment.amountCents)}</p>

      <div className="mt-6">
        {payment.status === "PENDING" && (
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="font-medium text-slate-900">Aguardando o pagamento</p>
            <p className="mt-1 text-sm text-slate-600">
              Na página segura de pagamento você escolhe entre PIX, boleto, cartão de crédito ou débito.
            </p>
            <a
              href={payment.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
            >
              Pagar agora
            </a>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-slate-500">
              <li>PIX e cartão: o plano é liberado assim que o pagamento é aprovado.</li>
              <li>
                Boleto: o plano só é liberado <strong>depois que o valor for compensado</strong>, em geral 1 a 2 dias
                úteis após o pagamento. O boleto vence em {dueLabel}.
              </li>
              <li>Esta página se atualiza sozinha quando a confirmação chegar.</li>
            </ul>
          </div>
        )}

        {payment.status === "PAID" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <p className="font-medium">Pagamento confirmado!</p>
            <p className="mt-1 text-sm">
              Seu plano {planLabel} está ativo{method ? ` (pago por ${method})` : ""}.
            </p>
          </div>
        )}

        {payment.status === "OVERDUE" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p className="font-medium">Cobrança vencida</p>
            <p className="mt-1 text-sm">
              O prazo de pagamento terminou em {dueLabel}. Se você já pagou, aguarde: a confirmação pode levar um pouco.
              Caso contrário, <Link href="/planos" className="underline">gere uma nova cobrança</Link>.
            </p>
          </div>
        )}

        {(payment.status === "REFUNDED" || payment.status === "CHARGEBACK") && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-slate-700">
            <p className="font-medium">{payment.status === "REFUNDED" ? "Pagamento estornado" : "Pagamento contestado"}</p>
            <p className="mt-1 text-sm">O plano deste pagamento foi desativado.</p>
          </div>
        )}

        {payment.status === "CANCELED" && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-slate-700">
            <p className="font-medium">Cobrança cancelada</p>
            <p className="mt-1 text-sm">
              Este pagamento não foi concluído. <Link href="/planos" className="underline">Gere uma nova cobrança</Link>.
            </p>
          </div>
        )}
      </div>

      <GatewayPaymentWatcher paymentId={payment.id} status={payment.status} />

      <Link href="/admin" className="mt-6 block text-center text-sm text-slate-500 underline">
        Ir para o painel
      </Link>
    </div>
  );
}
