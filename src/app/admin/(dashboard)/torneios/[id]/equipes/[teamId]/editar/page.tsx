import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EditTeamForm } from "@/components/admin/EditTeamForm";

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
    include: { tournament: true },
  });

  if (!team || team.tournament.organizerId !== session.user.id) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Editar equipe</h1>
      <p className="mt-1 text-sm text-slate-500">{team.tournament.name}</p>
      <div className="mt-6">
        <EditTeamForm team={team} />
      </div>
    </div>
  );
}
