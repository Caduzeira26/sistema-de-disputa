import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CompleteRosterForm } from "@/components/public/CompleteRosterForm";
import { TeamRosterList } from "@/components/public/TeamRosterList";
import { AssistantWidget } from "@/components/AssistantWidget";
import { TournamentHeaderLogo, TournamentWatermark } from "@/components/TournamentBranding";
import { getPlanLimits } from "@/lib/plans";
import { isRosterCompletionWindowOpen } from "@/lib/roster";

function formatCutoff(startDate: Date): string {
  return startDate.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default async function CompleteRosterPage({
  params,
}: {
  params: Promise<{ slug: string; teamId: string }>;
}) {
  const { slug, teamId } = await params;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { tournament: true, players: { where: { active: true }, orderBy: { name: "asc" } } },
  });
  if (!team || team.tournament.slug !== slug) notFound();

  const { tournament } = team;
  const limits = await getPlanLimits(tournament.organizerId);
  const open = isRosterCompletionWindowOpen(tournament) && team.status !== "REJECTED";

  return (
    <main className="relative mx-auto w-full max-w-2xl flex-1 overflow-hidden px-4 py-10">
      <TournamentWatermark logoUrl={tournament.logoUrl} />
      <div className="flex items-start gap-3">
        <TournamentHeaderLogo logoUrl={tournament.logoUrl} tournamentName={tournament.name} />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Completar equipe</h1>
          <p className="mt-1 text-sm text-slate-500">
            {team.name} — {tournament.name}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Jogadores já cadastrados ({team.players.length})</h2>
        <TeamRosterList teamId={team.id} players={team.players} canRemove={open} />
      </div>

      {!open ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {team.status === "REJECTED"
            ? "Esta equipe foi rejeitada pelo organizador e não pode mais ser completada."
            : tournament.status === "FINISHED"
              ? "O campeonato já terminou — não é mais possível adicionar ou remover jogadores."
              : "O prazo para alterar os jogadores desta equipe já encerrou."}
        </p>
      ) : (
        <div className="mt-6">
          <p className="mb-4 text-sm text-slate-500">
            {tournament.status === "IN_PROGRESS"
              ? "O campeonato já começou, mas você ainda pode adicionar ou remover jogadores até ele terminar."
              : tournament.startDate
                ? `Você pode adicionar ou remover jogadores até o início do campeonato, em ${formatCutoff(tournament.startDate)}.`
                : "Você pode adicionar ou remover jogadores até o início do campeonato."}
          </p>
          <CompleteRosterForm
            teamId={team.id}
            sportType={tournament.sportType}
            existingPlayerCount={team.players.length}
            canManageAthleteRegistry={limits.canManageAthleteRegistry}
          />
        </div>
      )}

      <AssistantWidget
        context="ROSTER_COMPLETION"
        teamId={team.id}
        title="Ajuda para completar a equipe"
        label="Abrir ajuda para completar a equipe"
        greeting={`Oi! 👋 Posso te ajudar com dúvidas sobre completar o elenco de ${team.name} no ${tournament.name} — prazo, CPF, o que dá pra fazer aqui. Pergunta à vontade.`}
      />
    </main>
  );
}
