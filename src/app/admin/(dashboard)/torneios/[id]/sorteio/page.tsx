import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DrawBoard } from "@/components/draw/DrawBoard";
import { DrawControls } from "@/components/admin/DrawControls";
import { DrawSetupForm } from "@/components/admin/DrawSetupForm";
import type { DrawKind, DrawStep } from "@/lib/draw";
import { LOBBY_SIZE } from "@/lib/lobbyScoring";

export default async function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      draw: true,
      teams: { where: { status: "APPROVED" }, orderBy: { createdAt: "asc" } },
      _count: { select: { matches: true } },
    },
  });
  if (!tournament || tournament.organizerId !== session.user.id) notFound();

  const isLobby = tournament.format === "LOBBY_LEAGUE";
  const usesGroups = isLobby || tournament.format === "GROUPS_SINGLE_ELIM" || tournament.format === "GROUPS_DOUBLE_ELIM";
  const teamNames = Object.fromEntries(tournament.teams.map((t) => [t.id, t.name]));
  const draw = tournament.draw;
  const steps = (draw?.steps ?? []) as unknown as DrawStep[];
  const bracketGenerated = tournament._count.matches > 0;

  return (
    <div>
      <Link href={`/admin/torneios/${tournament.id}`} className="text-sm text-slate-500 underline">
        ← Voltar ao torneio
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sorteio — {tournament.name}</h1>

      {draw && (
        <p className="mt-1 text-sm text-slate-500">
          Tela pública para projetar ao vivo:{" "}
          <Link href={`/torneios/${tournament.slug}/sorteio`} target="_blank" className="underline">
            /torneios/{tournament.slug}/sorteio
          </Link>
        </p>
      )}

      <div className="mt-6">
        {!draw && bracketGenerated && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Este chaveamento foi gerado antes do sorteio oficial existir, então não há sorteio para mostrar.
          </p>
        )}

        {!draw && !bracketGenerated && (
          <>
            <p className="mb-6 text-sm text-slate-600">
              O sorteio é feito em cerimônia, uma equipe por vez, como numa competição oficial. Defina os potes, inicie e
              depois revele as equipes. O resultado já é sorteado com um gerador aleatório seguro e não muda se você
              recarregar a página.
            </p>
            {tournament.teams.length < 2 ? (
              <p className="text-sm text-slate-500">É preciso pelo menos 2 equipes aprovadas para fazer o sorteio.</p>
            ) : isLobby && tournament.teams.length <= LOBBY_SIZE ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Com até {LOBBY_SIZE} equipes todas jogam na mesma sala, então não há sorteio de grupos. Volte ao torneio e
                crie as quedas.
              </p>
            ) : (
              <DrawSetupForm
                tournamentId={tournament.id}
                teams={tournament.teams.map((t) => ({ id: t.id, name: t.name, pot: t.pot }))}
                usesGroups={usesGroups}
                defaultNumGroups={
                  tournament.numGroups ??
                  (isLobby
                    ? Math.ceil(tournament.teams.length / LOBBY_SIZE)
                    : Math.max(1, Math.round(Math.sqrt(tournament.teams.length))))
                }
              />
            )}
          </>
        )}

        {draw && (
          <div className="flex flex-col gap-6">
            {draw.status === "IN_PROGRESS" && (
              <DrawControls tournamentId={tournament.id} revealed={draw.revealed} total={steps.length} />
            )}
            {draw.status === "COMPLETED" && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Sorteio concluído e chaveamento gerado.
              </p>
            )}
            <DrawBoard
              kind={draw.kind as DrawKind}
              steps={steps}
              revealed={draw.status === "COMPLETED" ? steps.length : draw.revealed}
              total={steps.length}
              numGroups={draw.numGroups ?? 1}
              teamNames={teamNames}
            />
          </div>
        )}
      </div>
    </div>
  );
}
