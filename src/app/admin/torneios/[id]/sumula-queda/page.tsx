import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PrintButton } from "@/components/PrintButton";
import { QuedaSheet } from "@/components/sumula/QuedaSheet";

/** Free Fire / Just Dance em baterias: folha da queda já com as equipes aprovadas (por grupo, se houver). */
export default async function PrintQuedaSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ grupo?: string }>;
}) {
  const { id } = await params;
  const { grupo } = await searchParams;
  const session = await auth();
  if (!session?.user) notFound();
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      groups: { orderBy: { name: "asc" } },
      teams: {
        where: { status: "APPROVED" },
        orderBy: { name: "asc" },
        include: { players: { where: { active: true }, orderBy: [{ shirtNumber: "asc" }, { name: "asc" }] } },
      },
    },
  });
  if (!tournament || tournament.organizerId !== session.user.id) notFound();

  const teams = tournament.teams
    .filter((t) => !grupo || t.groupId === grupo)
    .map((t) => ({ name: t.name, players: t.players.map((p) => p.name) }));

  return (
    <main className="mx-auto w-full max-w-4xl bg-white px-4 py-6 print:max-w-none print:p-0">
      <style>{`@page { size: A4 portrait; margin: 10mm; }`}</style>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={`/admin/torneios/${tournament.id}`} className="text-sm text-slate-500 underline">
          Voltar ao torneio
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {tournament.groups.length > 1 && (
            <>
              <Link href={`/admin/torneios/${tournament.id}/sumula-queda`} className="text-slate-500 underline">
                Todas
              </Link>
              {tournament.groups.map((g) => (
                <Link key={g.id} href={`/admin/torneios/${tournament.id}/sumula-queda?grupo=${g.id}`} className="text-slate-500 underline">
                  {g.name}
                </Link>
              ))}
            </>
          )}
          <Link href={`/admin/torneios/${tournament.id}/sumula-em-branco`} className="text-slate-500 underline">
            Em branco
          </Link>
          <PrintButton label="Imprimir" />
        </div>
      </div>
      <QuedaSheet sportType={tournament.sportType} heats={tournament.format === "HEATS"} tournament={tournament} teams={teams} />
    </main>
  );
}
