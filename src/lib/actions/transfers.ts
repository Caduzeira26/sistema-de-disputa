"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getAthleteCurrentPlayer, isTransferWindowOpen, isValidDocumentFormat, normalizeDocument } from "@/lib/athletes";
import { getPlanLimits } from "@/lib/plans";

const requestTransferSchema = z.object({
  tournamentId: z.string().min(1),
  document: z.string().min(1, "Informe o CPF do atleta"),
  toTeamId: z.string().min(1, "Selecione a equipe de destino"),
  requestedByName: z.string().min(2, "Informe seu nome"),
  requestedByContact: z.string().optional(),
});

export type RequestTransferState = { error?: string; success?: boolean };

export async function requestTransfer(
  _prevState: RequestTransferState,
  formData: FormData
): Promise<RequestTransferState> {
  const parsed = requestTransferSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    document: formData.get("document"),
    toTeamId: formData.get("toTeamId"),
    requestedByName: formData.get("requestedByName"),
    requestedByContact: formData.get("requestedByContact"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  if (!isValidDocumentFormat(parsed.data.document)) {
    return { error: "CPF inválido. Informe os 11 dígitos." };
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: parsed.data.tournamentId } });
  if (!tournament) {
    return { error: "Torneio não encontrado." };
  }

  const limits = await getPlanLimits(tournament.organizerId);
  if (!limits.canManageAthleteRegistry) {
    return { error: "Transferências não estão disponíveis para este campeonato." };
  }
  if (!isTransferWindowOpen(tournament)) {
    return { error: "O prazo para solicitar transferências neste campeonato já encerrou." };
  }

  const toTeam = await prisma.team.findUnique({ where: { id: parsed.data.toTeamId } });
  if (!toTeam || toTeam.tournamentId !== tournament.id || toTeam.status !== "APPROVED") {
    return { error: "Equipe de destino inválida." };
  }

  const document = normalizeDocument(parsed.data.document);
  const athlete = await prisma.athlete.findUnique({ where: { document } });
  if (!athlete) {
    return { error: "Nenhum atleta encontrado com esse CPF." };
  }

  const currentPlayer = await getAthleteCurrentPlayer(athlete.id, tournament.id);
  if (!currentPlayer) {
    return { error: "Esse atleta não está em nenhuma equipe deste campeonato." };
  }
  if (currentPlayer.teamId === toTeam.id) {
    return { error: "O atleta já está nessa equipe." };
  }

  await prisma.transferRequest.create({
    data: {
      tournamentId: tournament.id,
      athleteId: athlete.id,
      fromTeamId: currentPlayer.teamId,
      toTeamId: toTeam.id,
      requestedByName: parsed.data.requestedByName,
      requestedByContact: parsed.data.requestedByContact || null,
    },
  });

  revalidatePath(`/admin/torneios/${tournament.id}`);
  return { success: true };
}

async function requireOrganizerForTransferRequest(transferRequestId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");

  const transferRequest = await prisma.transferRequest.findUnique({
    where: { id: transferRequestId },
    include: { tournament: true },
  });
  if (!transferRequest || transferRequest.tournament.organizerId !== session.user.id) {
    throw new Error("Solicitação não encontrada.");
  }
  return transferRequest;
}

export async function decideTransferRequest(formData: FormData) {
  const transferRequestId = formData.get("transferRequestId") as string;
  const decision = formData.get("decision") as "APPROVED" | "REJECTED";
  const transferRequest = await requireOrganizerForTransferRequest(transferRequestId);

  if (transferRequest.status !== "PENDING") return;

  if (decision === "APPROVED") {
    await prisma.$transaction(async (tx) => {
      const athlete = await tx.athlete.findUniqueOrThrow({ where: { id: transferRequest.athleteId } });
      const oldPlayer = transferRequest.fromTeamId
        ? await tx.player.findFirst({
            where: { teamId: transferRequest.fromTeamId, athleteId: transferRequest.athleteId, active: true },
          })
        : null;

      await tx.player.create({
        data: {
          teamId: transferRequest.toTeamId,
          athleteId: transferRequest.athleteId,
          name: athlete.name,
          shirtNumber: oldPlayer?.shirtNumber ?? null,
          position: oldPlayer?.position ?? null,
          birthDate: oldPlayer?.birthDate ?? athlete.birthDate ?? null,
        },
      });
      if (oldPlayer) {
        await tx.player.update({ where: { id: oldPlayer.id }, data: { active: false } });
      }
      await tx.transferRequest.update({
        where: { id: transferRequest.id },
        data: { status: "APPROVED", decidedAt: new Date() },
      });
    });
  } else if (decision === "REJECTED") {
    await prisma.transferRequest.update({
      where: { id: transferRequest.id },
      data: { status: "REJECTED", decidedAt: new Date() },
    });
  }

  revalidatePath(`/admin/torneios/${transferRequest.tournamentId}`);
}
