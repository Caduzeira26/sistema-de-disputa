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
import { MAX_PLAYERS_PER_TEAM, MIN_PLAYERS_PER_TEAM, SPORT_LABELS } from "@/lib/sport";
import { isRosterCompletionWindowOpen } from "@/lib/roster";

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
  /** The created team's id, so the success screen can link to its "complete roster" page. */
  teamId?: string;
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

  const maxPlayers = MAX_PLAYERS_PER_TEAM[tournament.sportType];
  if (maxPlayers && parsed.data.players.length > maxPlayers) {
    return {
      error: `Este campeonato permite no máximo ${maxPlayers} jogadores por equipe (${SPORT_LABELS[tournament.sportType]}).`,
    };
  }

  const limits = await getPlanLimits(tournament.organizerId);
  const teamCount = await countTeamsForLimit(tournament.id);
  if (!isWithinTeamLimit(limits, teamCount)) {
    return { error: "Este campeonato atingiu o limite de equipes permitido pelo plano do organizador." };
  }

  if (limits.canManageAthleteRegistry) {
    const invalidPlayer = parsed.data.players.find((p) => p.document && !isValidDocumentFormat(p.document));
    if (invalidPlayer) {
      return { error: `CPF inválido para ${invalidPlayer.name} — informe 11 dígitos ou deixe em branco.` };
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
      return { success: true, paymentTxid: charge.txid, teamId: team.id };
    } catch (err) {
      // Team already exists PENDING; the organizer can still approve it manually if PIX is unavailable.
      const message = err instanceof EfiNotConfiguredError ? "Pagamento por PIX indisponível no momento." : "Não foi possível gerar a cobrança PIX. Tente novamente.";
      return { error: message };
    }
  }

  return { success: true, teamId: team.id };
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

const addPlayersSchema = z.object({
  teamId: z.string().min(1),
  players: z.array(playerSchema).min(1, "Adicione ao menos um jogador"),
});

export type AddPlayersState = { error?: string; success?: boolean };

/**
 * Public, unauthenticated (like registerTeam itself) — a team completes its
 * own roster later via the unguessable team-id link shown after
 * registration, the same trust model already used for the PIX payment
 * link. Only adds players; never touches or removes existing ones.
 */
export async function addPlayersToTeam(
  _prevState: AddPlayersState,
  formData: FormData
): Promise<AddPlayersState> {
  let players: unknown;
  try {
    players = JSON.parse((formData.get("playersJson") as string) || "[]");
  } catch {
    return { error: "Lista de jogadores inválida." };
  }

  const parsed = addPlayersSchema.safeParse({ teamId: formData.get("teamId"), players });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const team = await prisma.team.findUnique({
    where: { id: parsed.data.teamId },
    include: { tournament: true, players: { where: { active: true } } },
  });
  if (!team) {
    return { error: "Equipe não encontrada." };
  }
  if (team.status === "REJECTED") {
    return { error: "Esta equipe foi rejeitada pelo organizador e não pode mais ser completada." };
  }
  if (!isRosterCompletionWindowOpen(team.tournament)) {
    return { error: "O prazo para completar a equipe já encerrou." };
  }

  const maxPlayers = MAX_PLAYERS_PER_TEAM[team.tournament.sportType];
  if (maxPlayers && team.players.length + parsed.data.players.length > maxPlayers) {
    const remaining = Math.max(0, maxPlayers - team.players.length);
    return {
      error: `Este campeonato permite no máximo ${maxPlayers} jogadores por equipe — restam ${remaining} vaga(s).`,
    };
  }

  const limits = await getPlanLimits(team.tournament.organizerId);
  if (limits.canManageAthleteRegistry) {
    const invalidPlayer = parsed.data.players.find((p) => p.document && !isValidDocumentFormat(p.document));
    if (invalidPlayer) {
      return { error: `CPF inválido para ${invalidPlayer.name} — informe 11 dígitos ou deixe em branco.` };
    }
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
        teamId: team.id,
        name: p.name,
        shirtNumber: p.shirtNumber ?? null,
        position: p.position || null,
        birthDate,
        athleteId: athlete.id,
      };
    })
  );

  await prisma.player.createMany({ data: playersWithAthletes });

  revalidatePath(`/admin/torneios/${team.tournamentId}`);
  revalidatePath(`/torneios/${team.tournament.slug}/inscricao/equipe/${team.id}`);
  return { success: true };
}

export type RemovePlayerState = { error?: string; success?: boolean };

/**
 * Public, unauthenticated — same trust model as addPlayersToTeam (the
 * unguessable team-id link). Hard-deletes the roster row: safe within the
 * roster-completion window since the tournament hasn't started yet, so no
 * goal/card/basket/foul can reference this player. The Athlete record
 * itself is untouched, so it stays reusable in other registrations.
 */
export async function removePlayerFromTeam(
  _prevState: RemovePlayerState,
  formData: FormData
): Promise<RemovePlayerState> {
  const teamId = formData.get("teamId") as string;
  const playerId = formData.get("playerId") as string;
  if (!teamId || !playerId) {
    return { error: "Dados inválidos." };
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { tournament: true, players: { where: { active: true } } },
  });
  if (!team) {
    return { error: "Equipe não encontrada." };
  }
  if (team.status === "REJECTED") {
    return { error: "Esta equipe foi rejeitada pelo organizador e não pode mais ser alterada." };
  }
  if (!isRosterCompletionWindowOpen(team.tournament)) {
    return { error: "O prazo para alterar a equipe já encerrou." };
  }

  const player = team.players.find((p) => p.id === playerId);
  if (!player) {
    return { error: "Jogador não encontrado nesta equipe." };
  }

  const minPlayers = MIN_PLAYERS_PER_TEAM[team.tournament.sportType];
  if (team.players.length - 1 < minPlayers) {
    return {
      error: `Este campeonato exige pelo menos ${minPlayers} jogador(es) por equipe — remova outro jogador ou adicione um novo antes de tirar este.`,
    };
  }

  try {
    await prisma.player.delete({ where: { id: playerId } });
  } catch {
    return { error: "Não foi possível remover este jogador — ele já tem estatísticas registradas em alguma partida. Fale com o organizador." };
  }

  revalidatePath(`/admin/torneios/${team.tournamentId}`);
  revalidatePath(`/torneios/${team.tournament.slug}/inscricao/equipe/${team.id}`);
  return { success: true };
}
