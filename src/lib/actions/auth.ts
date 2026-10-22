"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  RESET_TOKEN_TTL_MS,
  generateResetToken,
  hashResetToken,
  isResetTokenUsable,
  isWithinResetCooldown,
} from "@/lib/passwordReset";
import { buildPasswordResetEmail, getAppUrl, isEmailConfigured, sendEmail } from "@/lib/email";

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

export type RequestPasswordResetState = { error?: string; success?: boolean };

/**
 * Always answers the same thing whether or not the e-mail has an account, so
 * the form can't be used to find out who is registered.
 */
export async function requestPasswordReset(
  _prevState: RequestPasswordResetState,
  formData: FormData
): Promise<RequestPasswordResetState> {
  const parsed = z.string().email("E-mail inválido").safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail inválido." };
  }
  if (!isEmailConfigured()) {
    return { error: "O envio de e-mail ainda não está disponível. Fale com o suporte para redefinir sua senha." };
  }

  const email = parsed.data.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: true };

  const latest = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (isWithinResetCooldown(latest?.createdAt ?? null)) return { success: true };

  const { token, tokenHash } = generateResetToken();
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    }),
  ]);

  try {
    const resetUrl = `${getAppUrl()}/admin/redefinir-senha?token=${token}`;
    await sendEmail({ to: user.email, ...buildPasswordResetEmail(resetUrl) });
  } catch (err) {
    console.error("[password-reset] failed to send e-mail", err);
    return { error: "Não foi possível enviar o e-mail agora. Tente novamente em instantes." };
  }

  return { success: true };
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Link inválido."),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type ResetPasswordState = { error?: string; success?: boolean };

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(parsed.data.token) },
  });
  if (!record || !isResetTokenUsable(record)) {
    return { error: "Este link expirou ou já foi usado. Peça um novo em \"Esqueci a senha\"." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { success: true };
}
