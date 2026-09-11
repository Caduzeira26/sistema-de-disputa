import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TeamRegistrationForm } from "@/components/public/TeamRegistrationForm";
import { AssistantWidget } from "@/components/AssistantWidget";
import { TournamentHeaderLogo, TournamentWatermark } from "@/components/TournamentBranding";
import { formatBRL, getPlanLimits } from "@/lib/plans";

export default async function TeamRegistrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tournament = await prisma.tournament.findUnique({ where: { slug } });
  if (!tournament) notFound();

  const limits = await getPlanLimits(tournament.organizerId);

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
          {tournament.registrationFeeCents ? (
            <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              Inscrição paga: {formatBRL(tournament.registrationFeeCents)} por equipe. Você poderá pagar via PIX
              logo após enviar os dados.
            </p>
          ) : null}
          <TeamRegistrationForm
            tournamentId={tournament.id}
            tournamentSlug={tournament.slug}
            canManageAthleteRegistry={limits.canManageAthleteRegistry}
          />
        </div>
      )}

      <AssistantWidget
        context="REGISTRATION"
        tournamentId={tournament.id}
        title="Ajuda com a inscrição"
        label="Abrir ajuda com a inscrição"
        greeting={`Oi! 👋 Posso te ajudar com dúvidas sobre esta ficha de inscrição do ${tournament.name} — o que cada campo significa, se tem taxa, o que acontece depois de enviar. Pergunta à vontade.`}
      />
    </main>
  );
}
