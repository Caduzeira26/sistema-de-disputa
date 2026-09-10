import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PixPaymentPanel } from "@/components/PixPaymentPanel";

export default async function TeamRegistrationPaymentPage({
  params,
}: {
  params: Promise<{ slug: string; txid: string }>;
}) {
  const { slug, txid } = await params;

  const transaction = await prisma.pixTransaction.findUnique({
    where: { txid },
    include: { team: true, tournament: true },
  });
  if (!transaction || transaction.kind !== "TEAM_REGISTRATION" || !transaction.team || !transaction.tournament) {
    notFound();
  }
  if (transaction.tournament.slug !== slug) notFound();

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <Link href={`/torneios/${slug}`} className="text-sm text-slate-500 underline">
        ← {transaction.tournament.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Inscrição de {transaction.team.name}</h1>
      <p className="mt-1 text-sm text-slate-500">Pague o PIX abaixo para confirmar a inscrição da equipe.</p>

      <div className="mt-6">
        <PixPaymentPanel
          txid={transaction.txid}
          amountCents={transaction.amountCents}
          qrCode={transaction.qrCode}
          qrCodeImageBase64={transaction.qrCodeImageBase64}
          initialStatus={transaction.status}
          paidMessage="A equipe já está confirmada no campeonato."
        />
      </div>
    </main>
  );
}
