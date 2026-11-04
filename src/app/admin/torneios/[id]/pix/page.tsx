import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SPORT_LABELS } from "@/lib/sport";
import { formatBRL } from "@/lib/plans";
import { buildPixPayload } from "@/lib/brcode";
import { buildQr, QUIET_ZONE } from "@/lib/qr";
import { manualPixFromTournament } from "@/lib/manualPix";
import { PrintButton } from "@/components/PrintButton";
import { PosterSheet } from "@/components/PosterSheet";

/** Printable A4 sheet with the PIX QR code (key + amount) for paying the registration. */
export default async function PixPosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament || tournament.organizerId !== session.user.id) notFound();

  const pix = manualPixFromTournament(tournament);
  if (!pix) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <Link href={`/admin/torneios/${tournament.id}`} className="text-sm text-slate-500 underline">
          Voltar ao torneio
        </Link>
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Este torneio ainda não tem chave PIX. Cadastre a chave na página do torneio para gerar o QR Code.
        </p>
      </main>
    );
  }

  const payload = buildPixPayload({ key: pix.key, holder: pix.holder, amountCents: pix.amountCents });
  const qr = buildQr(payload, "M");
  const total = qr.size + QUIET_ZONE * 2;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/admin/torneios/${tournament.id}`} className="text-sm text-slate-500 underline">
          Voltar ao torneio
        </Link>
        <PrintButton label="Imprimir QR Code do PIX (A4)" />
      </div>

      <PosterSheet>
        {tournament.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tournament.logoUrl} alt={`Logo de ${tournament.name}`} className="h-28 w-28 object-contain print:h-[40mm] print:w-[40mm]" />
        )}

        <div>
          <h1 className="text-2xl font-bold uppercase leading-tight text-slate-900 print:text-[30px]">{tournament.name}</h1>
          <p className="mt-2 text-base text-slate-600 print:text-2xl">{SPORT_LABELS[tournament.sportType]}</p>
        </div>

        <p className="text-xl font-semibold text-slate-900 print:text-4xl">
          Pagamento da inscrição{pix.amountCents ? ` — ${formatBRL(pix.amountCents)}` : ""}
        </p>

        <svg viewBox={`0 0 ${total} ${total}`} role="img" aria-label="QR Code do PIX" className="h-auto w-full max-w-xs print:w-[125mm] print:max-w-none">
          <rect width={total} height={total} fill="#ffffff" />
          <path d={qr.path} transform={`translate(${QUIET_ZONE} ${QUIET_ZONE})`} fill="#0f172a" shapeRendering="crispEdges" />
        </svg>

        <div>
          <p className="text-sm text-slate-700 print:text-2xl">Aponte a câmera do app do seu banco para o QR Code.</p>
          <p className="mt-2 text-sm text-slate-600 print:text-xl">
            Chave PIX: <span className="font-semibold text-slate-900">{pix.key}</span>
            {pix.holder ? ` · ${pix.holder}` : ""}
          </p>
          <p className="mt-2 text-xs text-slate-500 print:text-lg">Depois de pagar, envie o comprovante ao organizador.</p>
        </div>
      </PosterSheet>
    </main>
  );
}
