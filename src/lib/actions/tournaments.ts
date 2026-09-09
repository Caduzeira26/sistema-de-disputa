"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/slug";

const createTournamentSchema = z.object({
  name: z.string().min(2, "Informe o nome do torneio"),
  description: z.string().optional(),
  format: z.enum(["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "GROUPS_SINGLE_ELIM", "GROUPS_DOUBLE_ELIM"]),
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
