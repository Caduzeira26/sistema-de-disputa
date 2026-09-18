import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EditTeamForm } from "@/components/admin/EditTeamForm";
import { PlayerGoalkeeperEditor } from "@/components/admin/PlayerGoalkeeperEditor";
import { BrandFooter } from "@/components/BrandFooter";
import { getSportFamily } from "@/lib/sport";

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

  const hasGoalkeepers = getSportFamily(team.tournament.sportType) === "GOALS_CARDS";

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Editar equipe</h1>
      <p className="mt-1 text-sm text-slate-500">{team.tournament.name}</p>
      <div className="mt-6">
        <EditTeamForm team={team} />
      </div>

      {hasGoalkeepers && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Goleiros</h2>
          <p className="mb-3 text-sm text-slate-500">
            Marque quem joga no gol nesta equipe — alimenta a estatística de &quot;melhor goleiro&quot; do campeonato.
          </p>
          <PlayerGoalkeeperEditor teamId={team.id} players={team.players} />
        </div>
      )}

      <BrandFooter />
    </div>
  );
}
