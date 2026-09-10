"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { SPORT_TYPES } from "@/lib/sport";
import { saveTournamentLogo } from "@/lib/storage";

const createTournamentSchema = z
  .object({
    name: z.string().min(2, "Informe o nome do torneio"),
    description: z.string().optional(),
    format: z.enum(["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "GROUPS_SINGLE_ELIM", "GROUPS_DOUBLE_ELIM"]),
    sportType: z.enum(SPORT_TYPES),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: "A data de término não pode ser anterior à data de início.",
    path: ["endDate"],
  });

export type CreateTournamentState = {
  error?: string;
};

export async function createTournament(
  _prevState: CreateTournamentState,
  formData: FormData
): Promise<CreateTournamentState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const parsed = createTournamentSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    format: formData.get("format"),
    sportType: formData.get("sportType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const baseSlug = slugify(parsed.data.name) || "torneio";
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.tournament.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const tournament = await prisma.tournament.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      format: parsed.data.format,
      sportType: parsed.data.sportType,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      slug,
      organizerId: session.user.id,
    },
  });

  redirect(`/admin/torneios/${tournament.id}`);
}

const updateStatusSchema = z.object({
  tournamentId: z.string().min(1),
  status: z.enum(["DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS", "FINISHED"]),
});

export async function updateTournamentStatus(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const parsed = updateStatusSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await prisma.tournament.update({
    where: { id: parsed.data.tournamentId, organizerId: session.user.id },
    data: { status: parsed.data.status },
  });

  revalidatePath(`/admin/torneios/${parsed.data.tournamentId}`);
  revalidatePath("/admin");
}

const updateDatesSchema = z
  .object({
    tournamentId: z.string().min(1),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: "A data de término não pode ser anterior à data de início.",
    path: ["endDate"],
  });

export type UpdateDatesState = { error?: string };

export async function updateTournamentDates(_prevState: UpdateDatesState, formData: FormData): Promise<UpdateDatesState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = updateDatesSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: parsed.data.tournamentId } });
  if (!tournament || tournament.organizerId !== session.user.id) {
    return { error: "Torneio não encontrado." };
  }

  await prisma.tournament.update({
    where: { id: parsed.data.tournamentId },
    data: {
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });

  revalidatePath(`/admin/torneios/${parsed.data.tournamentId}`);
  revalidatePath(`/torneios/${tournament.slug}`);
  return {};
}

export type UpdateLogoState = { error?: string };

export async function updateTournamentLogo(_prevState: UpdateLogoState, formData: FormData): Promise<UpdateLogoState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada. Faça login novamente." };

  const tournamentId = formData.get("tournamentId") as string;
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.organizerId !== session.user.id) {
    return { error: "Torneio não encontrado." };
  }

  const logoFile = formData.get("logo");
  if (!(logoFile instanceof File) || logoFile.size === 0) {
    return { error: "Selecione um arquivo de imagem." };
  }
  if (!logoFile.type.startsWith("image/")) {
    return { error: "A logo deve ser um arquivo de imagem." };
  }
  if (logoFile.size > 5 * 1024 * 1024) {
    return { error: "A imagem deve ter no máximo 5MB." };
  }

  const logoUrl = await saveTournamentLogo(logoFile);
  await prisma.tournament.update({ where: { id: tournamentId }, data: { logoUrl } });

  revalidatePath(`/admin/torneios/${tournamentId}`);
  revalidatePath(`/torneios/${tournament.slug}`);
  return {};
}

export async function removeTournamentLogo(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const tournamentId = formData.get("tournamentId") as string;
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.organizerId !== session.user.id) return;

  await prisma.tournament.update({ where: { id: tournamentId }, data: { logoUrl: null } });
  revalidatePath(`/admin/torneios/${tournamentId}`);
  revalidatePath(`/torneios/${tournament.slug}`);
}
