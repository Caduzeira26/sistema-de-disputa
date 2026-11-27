import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PrintButton } from "@/components/PrintButton";
import { PrintableSumula } from "@/components/sumula/PrintableSumula";
import { QuedaSheet } from "@/components/sumula/QuedaSheet";
import { getSportFamily } from "@/lib/sport";

/** Súmula totalmente em branco da modalidade do campeonato, para uma emergência (sem jogo definido). */
export default async function BlankSumulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament || tournament.organizerId !== session.user.id) notFound();

  const quedas = getSportFamily(tournament.sportType) === "LOBBY_POINTS" || tournament.format === "HEATS";

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 py-6 print:max-w-none print:p-0">
      <style>{`@page { size: A4 portrait; margin: 10mm; }`}</style>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/admin/torneios/${tournament.id}`} className="text-sm text-slate-500 underline">
          Voltar ao torneio
        </Link>
        <PrintButton label="Imprimir súmula em branco" />
      </div>
      {quedas ? (
        <QuedaSheet sportType={tournament.sportType} heats={tournament.format === "HEATS"} tournament={tournament} teams={null} />
      ) : (
        <PrintableSumula sportType={tournament.sportType} tournament={tournament} match={null} teams={[null, null]} />
      )}
    </main>
  );
}
