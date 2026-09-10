"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const registerOrganizerSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export type RegisterOrganizerState = { error?: string; success?: boolean };

/**
 * Creates the User row only — establishing the session is left to the
 * client component (calling next-auth's signIn with the same credentials),
 * mirroring exactly how LoginForm.tsx already signs users in.
 */
export async function registerOrganizer(
  _prevState: RegisterOrganizerState,
  formData: FormData
): Promise<RegisterOrganizerState> {
  const parsed = registerOrganizerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe uma conta com este e-mail." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: { name: parsed.data.name, email, passwordHash },
  });

  return { success: true };
}
