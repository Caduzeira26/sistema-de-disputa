import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SPORT_LABELS } from "@/lib/sport";
import { formatTournamentDateRange } from "@/lib/formatDateRange";
import { getAppUrl } from "@/lib/email";
import { registrationUrl } from "@/lib/qr";
import { PrintButton } from "@/components/PrintButton";
import { PosterSheet } from "@/components/PosterSheet";
import { RegistrationQr } from "@/components/RegistrationQr";

/** Printable A4 poster: tournament logo + QR code that opens the online registration form. */
export default async function RegistrationPosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament || tournament.organizerId !== session.user.id) notFound();

  const url = registrationUrl(getAppUrl(), tournament.slug);
  const dates = formatTournamentDateRange(tournament.startDate, tournament.endDate);
  const open = tournament.status === "REGISTRATION_OPEN";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/admin/torneios/${tournament.id}`} className="text-sm text-slate-500 underline">
          Voltar ao torneio
        </Link>
        <PrintButton label="Imprimir cartaz (A4)" />
      </div>

      {!open && (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 print:hidden">
          As inscrições deste campeonato não estão abertas no momento. O QR Code já leva à ficha, mas ela só aceita
          envios com as inscrições abertas (mude o status do torneio para &quot;Inscrições abertas&quot;).
        </p>
      )}

      <PosterSheet>
        {tournament.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tournament.logoUrl} alt={`Logo de ${tournament.name}`} className="h-28 w-28 object-contain print:h-[40mm] print:w-[40mm]" />
        )}

        <div>
          <h1 className="text-2xl font-bold uppercase leading-tight text-slate-900 print:text-[30px]">{tournament.name}</h1>
          <p className="mt-2 text-base text-slate-600 print:text-2xl">
            {SPORT_LABELS[tournament.sportType]}
            {dates ? ` · ${dates}` : ""}
          </p>
        </div>

        <p className="text-xl font-semibold text-slate-900 print:text-4xl">Inscreva sua equipe</p>

        <div className="w-full max-w-xs print:w-[125mm] print:max-w-none">
          <RegistrationQr url={url} logoUrl={tournament.logoUrl} label={`QR Code da inscrição em ${tournament.name}`} />
        </div>

        <div>
          <p className="text-sm text-slate-700 print:text-2xl">Aponte a câmera do celular para o QR Code e preencha a ficha de inscrição.</p>
          <p className="mt-2 break-all text-xs text-slate-500 print:text-lg">{url}</p>
        </div>
      </PosterSheet>
    </main>
  );
}
