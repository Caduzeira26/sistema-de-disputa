"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { buildDrawSteps, cryptoRng, type DrawKind, type DrawStep } from "@/lib/draw";
import { generateBracketFromDraw } from "@/lib/services/bracket";
import { LOBBY_SIZE } from "@/lib/lobbyScoring";
import { HEAT_SIZE } from "@/lib/heats";

async function requireOwnedTournament(tournamentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.organizerId !== session.user.id) {
    throw new Error("Torneio não encontrado.");
  }
  return tournament;
}

function revalidateDraw(tournamentId: string, slug: string) {
  revalidatePath(`/admin/torneios/${tournamentId}`);
  revalidatePath(`/admin/torneios/${tournamentId}/sorteio`);
  revalidatePath(`/torneios/${slug}/sorteio`);
  revalidatePath(`/torneios/${slug}`);
}

export type DrawActionState = { error?: string };

/**
 * Saves the pots, draws the whole sequence with a cryptographic RNG and
 * stores it. The ceremony only reveals it step by step afterwards, so the
 * outcome can't change by reloading or re-clicking.
 */
export async function startDrawAction(_prev: DrawActionState, formData: FormData): Promise<DrawActionState> {
  const tournamentId = formData.get("tournamentId") as string;
  try {
    const tournament = await requireOwnedTournament(tournamentId);

    const [existingDraw, matchCount, teams] = await Promise.all([
      prisma.tournamentDraw.findUnique({ where: { tournamentId } }),
      prisma.match.count({ where: { tournamentId } }),
      prisma.team.findMany({ where: { tournamentId, status: "APPROVED" }, orderBy: { createdAt: "asc" } }),
    ]);
    if (existingDraw) return { error: "O sorteio deste torneio já foi iniciado." };
    if (matchCount > 0) return { error: "O chaveamento já foi gerado para este torneio." };
    if (teams.length < 2) return { error: "É preciso pelo menos 2 equipes aprovadas para fazer o sorteio." };

    const pots = teams.map((team) => {
      const raw = String(formData.get(`pot_${team.id}`) ?? "").trim();
      if (raw === "") return { id: team.id, pot: null };
      const pot = Number(raw);
      if (!Number.isInteger(pot) || pot < 1 || pot > 8) throw new Error("O pote deve ser um número de 1 a 8.");
      return { id: team.id, pot };
    });

    const isLobby = tournament.format === "LOBBY_LEAGUE";
    const isHeats = tournament.format === "HEATS";
    const usesGroups = isLobby || isHeats || tournament.format === "GROUPS_SINGLE_ELIM" || tournament.format === "GROUPS_DOUBLE_ELIM";
    const kind: DrawKind = usesGroups ? "GROUPS" : "KNOCKOUT";

    let numGroups: number | null = null;
    if (usesGroups) {
      numGroups = Number(formData.get("numGroups"));
      if (!Number.isInteger(numGroups) || numGroups < 1) return { error: "Informe o número de grupos." };
      if (teams.length / numGroups < 2) {
        return { error: "Cada grupo precisa ter pelo menos 2 equipes. Reduza o número de grupos." };
      }
      if (isHeats && Math.ceil(teams.length / numGroups) > HEAT_SIZE) {
        return { error: `Cada bateria comporta no máximo ${HEAT_SIZE} dançarinos. Aumente o número de baterias.` };
      }
      if (isLobby && Math.ceil(teams.length / numGroups) > LOBBY_SIZE) {
        return { error: `Cada grupo comporta no máximo ${LOBBY_SIZE} equipes (o tamanho de uma sala). Aumente o número de grupos.` };
      }
    }

    const steps: DrawStep[] = buildDrawSteps({ kind, teams: pots, numGroups: numGroups ?? undefined, rng: cryptoRng });

    await prisma.$transaction([
      ...pots.map((p) => prisma.team.update({ where: { id: p.id }, data: { pot: p.pot } })),
      prisma.tournament.update({ where: { id: tournamentId }, data: { numGroups } }),
      prisma.tournamentDraw.create({
        data: { tournamentId, kind, numGroups, steps: steps as unknown as object },
      }),
    ]);

    revalidateDraw(tournamentId, tournament.slug);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível iniciar o sorteio." };
  }
}

export async function revealNextAction(formData: FormData): Promise<void> {
  const tournamentId = formData.get("tournamentId") as string;
  const tournament = await requireOwnedTournament(tournamentId);

  const draw = await prisma.tournamentDraw.findUnique({ where: { tournamentId } });
  if (!draw || draw.status !== "IN_PROGRESS") return;
  const total = (draw.steps as unknown as DrawStep[]).length;
  if (draw.revealed >= total) return;

  await prisma.tournamentDraw.update({ where: { id: draw.id }, data: { revealed: draw.revealed + 1 } });
  revalidateDraw(tournamentId, tournament.slug);
}

export async function revealAllAction(formData: FormData): Promise<void> {
  const tournamentId = formData.get("tournamentId") as string;
  const tournament = await requireOwnedTournament(tournamentId);

  const draw = await prisma.tournamentDraw.findUnique({ where: { tournamentId } });
  if (!draw || draw.status !== "IN_PROGRESS") return;
  const total = (draw.steps as unknown as DrawStep[]).length;

  await prisma.tournamentDraw.update({ where: { id: draw.id }, data: { revealed: total } });
  revalidateDraw(tournamentId, tournament.slug);
}

export async function confirmDrawAction(_prev: DrawActionState, formData: FormData): Promise<DrawActionState> {
  const tournamentId = formData.get("tournamentId") as string;
  try {
    const tournament = await requireOwnedTournament(tournamentId);
    await generateBracketFromDraw(tournamentId);
    revalidateDraw(tournamentId, tournament.slug);
    revalidatePath("/torneios");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível gerar o chaveamento." };
  }
}

/** Throws the draw away (only before it's confirmed) so the organizer can redo it, e.g. to fix the pots. */
export async function cancelDrawAction(formData: FormData): Promise<void> {
  const tournamentId = formData.get("tournamentId") as string;
  const tournament = await requireOwnedTournament(tournamentId);

  await prisma.tournamentDraw.deleteMany({ where: { tournamentId, status: "IN_PROGRESS" } });
  revalidateDraw(tournamentId, tournament.slug);
}
