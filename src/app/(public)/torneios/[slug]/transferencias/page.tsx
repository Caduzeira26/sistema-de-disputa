import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TransferRequestForm } from "@/components/public/TransferRequestForm";
import { TournamentHeaderLogo, TournamentWatermark } from "@/components/TournamentBranding";
import { getPlanLimits } from "@/lib/plans";

export default async function TransferRequestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament) notFound();

  const limits = await getPlanLimits(tournament.organizerId);

  const teams = limits.canManageAthleteRegistry
    ? await prisma.team.findMany({
        where: { tournamentId: tournament.id, status: "APPROVED" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <main className="relative mx-auto w-full max-w-2xl flex-1 overflow-hidden px-4 py-10">
      <TournamentWatermark logoUrl={tournament.logoUrl} />
      <div className="flex items-start gap-3">
        <TournamentHeaderLogo logoUrl={tournament.logoUrl} tournamentName={tournament.name} />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Transferência de atleta</h1>
          <p className="mt-1 text-sm text-slate-500">{tournament.name}</p>
        </div>
      </div>

      {!limits.canManageAthleteRegistry ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Este campeonato não tem o cadastro de atletas/transferências habilitado.
        </p>
      ) : !tournament.transferDeadline || new Date() < tournament.transferDeadline ? (
        <div className="mt-6">
          <TransferRequestForm tournamentId={tournament.id} teams={teams} />
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          O prazo para solicitar transferências neste campeonato já encerrou.
        </p>
      )}
    </main>
  );
}
