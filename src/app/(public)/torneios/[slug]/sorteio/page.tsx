import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AutoRefresh } from "@/components/draw/AutoRefresh";
import { DrawBoard } from "@/components/draw/DrawBoard";
import { TournamentHeaderLogo, TournamentWatermark } from "@/components/TournamentBranding";
import type { DrawKind, DrawStep } from "@/lib/draw";

export const dynamic = "force-dynamic";

export default async function PublicDrawPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { draw: true, teams: { where: { status: "APPROVED" } } },
  });
  if (!tournament) notFound();

  const draw = tournament.draw;
  const steps = (draw?.steps ?? []) as unknown as DrawStep[];
  const live = draw?.status === "IN_PROGRESS";
  const teamNames = Object.fromEntries(tournament.teams.map((t) => [t.id, t.name]));

  return (
    <main className="relative mx-auto w-full max-w-5xl flex-1 overflow-hidden px-4 py-10">
      <TournamentWatermark logoUrl={tournament.logoUrl} />
      {live && <AutoRefresh />}

      <Link href={`/torneios/${tournament.slug}`} className="text-sm text-slate-500 underline">
        ← {tournament.name}
      </Link>
      <div className="mt-2 flex items-start gap-3">
        <TournamentHeaderLogo logoUrl={tournament.logoUrl} tournamentName={tournament.name} />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sorteio</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tournament.name}
            {live && " · ao vivo, atualiza sozinho"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {!draw ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            O sorteio deste campeonato ainda não foi realizado.
          </p>
        ) : (
          <DrawBoard
            kind={draw.kind as DrawKind}
            steps={steps}
            revealed={draw.status === "COMPLETED" ? steps.length : draw.revealed}
            total={steps.length}
            numGroups={draw.numGroups ?? 1}
            teamNames={teamNames}
            groupWord={tournament.format === "HEATS" ? "Bateria" : "Grupo"}
          />
        )}
      </div>
    </main>
  );
}
