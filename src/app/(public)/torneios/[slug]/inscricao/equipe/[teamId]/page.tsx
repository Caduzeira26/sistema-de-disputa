import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CompleteRosterForm } from "@/components/public/CompleteRosterForm";
import { AssistantWidget } from "@/components/AssistantWidget";
import { TournamentHeaderLogo, TournamentWatermark } from "@/components/TournamentBranding";
import { getPlanLimits } from "@/lib/plans";
import { isRosterCompletionWindowOpen } from "@/lib/roster";

function formatCutoff(startDate: Date): string {
  const cutoff = new Date(startDate);
  cutoff.setDate(cutoff.getDate() - 1);
  return cutoff.toLocaleDateString("pt-BR", { timeZone: "UTC" });
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
        {team.players.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum jogador cadastrado ainda.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {team.players.map((p) => (
              <li key={p.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {p.name}
                {p.shirtNumber !== null ? ` (${p.shirtNumber})` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!open ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {team.status === "REJECTED"
            ? "Esta equipe foi rejeitada pelo organizador e não pode mais ser completada."
            : tournament.status === "IN_PROGRESS" || tournament.status === "FINISHED"
              ? "O campeonato já começou — não é mais possível adicionar jogadores."
              : "O prazo para adicionar jogadores a esta equipe já encerrou."}
        </p>
      ) : (
        <div className="mt-6">
          <p className="mb-4 text-sm text-slate-500">
            {tournament.startDate
              ? `Você pode adicionar jogadores até ${formatCutoff(tournament.startDate)} (1 dia antes do início do campeonato).`
              : "Você pode adicionar jogadores até o início do campeonato."}
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
