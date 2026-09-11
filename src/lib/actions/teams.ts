"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { saveTeamLogo } from "@/lib/storage";
import { countTeamsForLimit, getPlanLimits, isWithinTeamLimit } from "@/lib/plans";
import { createTeamRegistrationCharge } from "@/lib/pix";
import { EfiNotConfiguredError } from "@/lib/efi";
import { findOrCreateAthlete, isValidDocumentFormat, normalizeDocument } from "@/lib/athletes";
import { MIN_PLAYERS_PER_TEAM, SPORT_LABELS } from "@/lib/sport";

const playerSchema = z.object({
  name: z.string().min(1, "Nome do jogador é obrigatório"),
  shirtNumber: z.coerce.number().int().min(0).max(999).nullish(),
  position: z.string().nullish(),
  birthDate: z.string().nullish(),
  /** CPF — only collected/validated when the tournament's plan allows the athlete registry. */
  document: z.string().nullish(),
});

const registerTeamSchema = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(2, "Informe o nome da equipe"),
  managerName: z.string().min(2, "Informe o responsável/técnico"),
  contactPhone: z.string().optional(),
  contactEmail: z.union([z.string().email("E-mail inválido"), z.literal("")]).optional(),
  players: z.array(playerSchema).min(1, "Cadastre ao menos um jogador"),
});

export type RegisterTeamState = {
  error?: string;
  success?: boolean;
  /** Set when the tournament charges a registration fee — the form should redirect to the PIX payment page. */
  paymentTxid?: string;
};

export async function registerTeam(
  _prevState: RegisterTeamState,
  formData: FormData
): Promise<RegisterTeamState> {
  let players: unknown;
  try {
    players = JSON.parse((formData.get("playersJson") as string) || "[]");
  } catch {
    return { error: "Lista de jogadores inválida." };
  }

  const parsed = registerTeamSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    name: formData.get("name"),
    managerName: formData.get("managerName"),
    contactPhone: formData.get("contactPhone"),
    contactEmail: formData.get("contactEmail"),
    players,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: parsed.data.tournamentId },
  });
  if (!tournament || tournament.status !== "REGISTRATION_OPEN") {
    return { error: "As inscrições para este torneio não estão abertas." };
  }

  const minPlayers = MIN_PLAYERS_PER_TEAM[tournament.sportType];
  if (parsed.data.players.length < minPlayers) {
    return {
      error: `Este campeonato exige pelo menos ${minPlayers} jogador(es) por equipe (${SPORT_LABELS[tournament.sportType]}).`,
    };
  }

  const limits = await getPlanLimits(tournament.organizerId);
  const teamCount = await countTeamsForLimit(tournament.id);
  if (!isWithinTeamLimit(limits, teamCount)) {
    return { error: "Este campeonato atingiu o limite de equipes permitido pelo plano do organizador." };
  }

  if (limits.canManageAthleteRegistry) {
    const invalidPlayer = parsed.data.players.find((p) => !p.document || !isValidDocumentFormat(p.document));
    if (invalidPlayer) {
      return { error: `Informe o CPF (11 dígitos) de ${invalidPlayer.name}.` };
    }
  }

  const logoFile = formData.get("logo");
  let logoUrl: string | undefined;
  if (logoFile instanceof File && logoFile.size > 0) {
    if (!logoFile.type.startsWith("image/")) {
      return { error: "O escudo deve ser um arquivo de imagem." };
    }
    if (logoFile.size > 5 * 1024 * 1024) {
      return { error: "A imagem do escudo deve ter no máximo 5MB." };
    }
    logoUrl = await saveTeamLogo(logoFile);
  }

  const playersWithAthletes = await Promise.all(
    parsed.data.players.map(async (p) => {
      const birthDate = p.birthDate ? new Date(p.birthDate) : null;
      const athlete = await findOrCreateAthlete({
        name: p.name,
        document: p.document ? normalizeDocument(p.document) : null,
        birthDate,
      });
      return {
        name: p.name,
        shirtNumber: p.shirtNumber ?? null,
        position: p.position || null,
        birthDate,
        athleteId: athlete.id,
      };
    })
  );

  const team = await prisma.team.create({
    data: {
      tournamentId: parsed.data.tournamentId,
      name: parsed.data.name,
      managerName: parsed.data.managerName,
      contactPhone: parsed.data.contactPhone || null,
      contactEmail: parsed.data.contactEmail || null,
      logoUrl,
      players: {
        create: playersWithAthletes,
      },
    },
  });

  revalidatePath(`/admin/torneios/${parsed.data.tournamentId}`);

  if (tournament.registrationFeeCents && tournament.registrationFeeCents > 0) {
    try {
      const charge = await createTeamRegistrationCharge(team.id);
      return { success: true, paymentTxid: charge.txid };
    } catch (err) {
      // Team already exists PENDING; the organizer can still approve it manually if PIX is unavailable.
      const message = err instanceof EfiNotConfiguredError ? "Pagamento por PIX indisponível no momento." : "Não foi possível gerar a cobrança PIX. Tente novamente.";
      return { error: message };
    }
  }

  return { success: true };
}

async function requireOrganizerForTeam(teamId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { tournament: true },
  });
  if (!team || team.tournament.organizerId !== session.user.id) {
    throw new Error("Equipe não encontrada.");
  }
  return team;
}

export async function setTeamStatus(formData: FormData) {
  const teamId = formData.get("teamId") as string;
  const status = formData.get("status") as "APPROVED" | "REJECTED" | "PENDING";
  const team = await requireOrganizerForTeam(teamId);

  await prisma.team.update({ where: { id: teamId }, data: { status } });
  revalidatePath(`/admin/torneios/${team.tournamentId}`);
}

export async function deleteTeam(formData: FormData) {
  const teamId = formData.get("teamId") as string;
  const team = await requireOrganizerForTeam(teamId);

  await prisma.team.delete({ where: { id: teamId } });
  revalidatePath(`/admin/torneios/${team.tournamentId}`);
}

const updateTeamSchema = z.object({
  teamId: z.string().min(1),
  name: z.string().min(2, "Informe o nome da equipe"),
  managerName: z.string().min(2, "Informe o responsável/técnico"),
  contactPhone: z.string().optional(),
  contactEmail: z.union([z.string().email("E-mail inválido"), z.literal("")]).optional(),
});

export type UpdateTeamState = { error?: string; success?: boolean };

export async function updateTeam(
  _prevState: UpdateTeamState,
  formData: FormData
): Promise<UpdateTeamState> {
  const parsed = updateTeamSchema.safeParse({
    teamId: formData.get("teamId"),
    name: formData.get("name"),
    managerName: formData.get("managerName"),
    contactPhone: formData.get("contactPhone"),
    contactEmail: formData.get("contactEmail"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const team = await requireOrganizerForTeam(parsed.data.teamId);

  await prisma.team.update({
    where: { id: team.id },
    data: {
      name: parsed.data.name,
      managerName: parsed.data.managerName,
      contactPhone: parsed.data.contactPhone || null,
      contactEmail: parsed.data.contactEmail || null,
    },
  });

  revalidatePath(`/admin/torneios/${team.tournamentId}`);
  return { success: true };
}
