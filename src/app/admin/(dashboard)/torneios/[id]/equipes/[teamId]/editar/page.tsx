import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EditTeamForm } from "@/components/admin/EditTeamForm";
import { PlayerGoalkeeperEditor } from "@/components/admin/PlayerGoalkeeperEditor";
import { BrandFooter } from "@/components/BrandFooter";
import { hasGoalkeeper } from "@/lib/sport";

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string; teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { tournament: true, players: { where: { active: true }, orderBy: { name: "asc" } } },
  });

  if (!team || team.tournament.organizerId !== session.user.id) notFound();

  const hasGoalkeepers = hasGoalkeeper(team.tournament.sportType);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Editar equipe</h1>
      <p className="mt-1 text-sm text-slate-500">{team.tournament.name}</p>
      <div className="mt-6">
        <EditTeamForm team={team} />
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Jogadores</h2>
        <p className="mb-3 text-sm text-slate-500">
          O RG sai impresso na súmula do jogo.
          {hasGoalkeepers && " Marque também quem joga no gol: alimenta a estatística de \"melhor goleiro\" do campeonato."}
        </p>
        <PlayerGoalkeeperEditor teamId={team.id} players={team.players} showGoalkeeper={hasGoalkeepers} />
      </div>

      <BrandFooter />
    </div>
  );
}
