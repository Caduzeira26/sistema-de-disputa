import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reopenLobbyRoundAction } from "@/lib/actions/lobby";
import { reopenHeatAction } from "@/lib/actions/heats";
import { LobbyRoundForm } from "@/components/admin/LobbyRoundForm";
import { HeatForm } from "@/components/admin/HeatForm";

export default async function LobbyRoundPage({ params }: { params: Promise<{ id: string; roundId: string }> }) {
  const { id, roundId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const round = await prisma.lobbyRound.findUnique({
    where: { id: roundId },
    include: {
      tournament: true,
      group: true,
      entries: { include: { team: true }, orderBy: { team: { name: "asc" } } },
    },
  });
  if (!round || round.tournamentId !== id || round.tournament.organizerId !== session.user.id) notFound();

  const isHeat = round.stage === "HEAT";
  const stageLabel = isHeat
    ? `Rodada ${round.phase}`
    : round.stage === "FINAL"
      ? "Grande final"
      : (round.group?.name ?? "Fase classificatória");
  const locked = round.tournament.status === "FINISHED";

  return (
    <div>
      <Link href={`/admin/torneios/${id}`} className="text-sm text-slate-500 underline">
        ← Voltar ao torneio
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        {isHeat ? "Bateria" : "Queda"} {round.number} <span className="text-slate-400">·</span> {stageLabel}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{round.tournament.name}</p>

      {round.finished && (
        <p className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
          {isHeat ? "Bateria encerrada" : "Queda encerrada"}
        </p>
      )}

      <div className="mt-6">
        {locked ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            O campeonato já foi encerrado. Reabra o campeonato na página do torneio para corrigir{" "}
            {isHeat ? "esta bateria" : "esta queda"}.
          </p>
        ) : isHeat ? (
          <HeatForm
            roundId={round.id}
            dancers={round.entries.map((e) => ({ id: e.teamId, name: e.team.name, score: e.score }))}
          />
        ) : (
          <LobbyRoundForm
            roundId={round.id}
            teams={round.entries.map((e) => ({ id: e.teamId, name: e.team.name, placement: e.placement, kills: e.kills }))}
          />
        )}
      </div>

      {round.finished && !locked && (
        <form action={isHeat ? reopenHeatAction : reopenLobbyRoundAction} className="mt-6">
          <input type="hidden" name="roundId" value={round.id} />
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {isHeat ? "Limpar resultado e reabrir a bateria" : "Limpar resultado e reabrir a queda"}
          </button>
        </form>
      )}
    </div>
  );
}
