import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TeamRegistrationForm } from "@/components/public/TeamRegistrationForm";
import { TournamentHeaderLogo, TournamentWatermark } from "@/components/TournamentBranding";

export default async function TeamRegistrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament) notFound();

  return (
    <main className="relative mx-auto w-full max-w-2xl flex-1 overflow-hidden px-4 py-10">
      <TournamentWatermark logoUrl={tournament.logoUrl} />
      <div className="flex items-start gap-3">
        <TournamentHeaderLogo logoUrl={tournament.logoUrl} tournamentName={tournament.name} />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inscrição de equipe</h1>
          <p className="mt-1 text-sm text-slate-500">{tournament.name}</p>
        </div>
      </div>

      {tournament.status !== "REGISTRATION_OPEN" ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          As inscrições para este torneio não estão abertas no momento.
        </p>
      ) : (
        <div className="mt-6">
          <TeamRegistrationForm tournamentId={tournament.id} />
        </div>
      )}
    </main>
  );
}
