import { z } from "zod";

/** Form for a signed-in organizer changing their own password (current password required). */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    password: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.password !== d.currentPassword, {
    message: "A nova senha precisa ser diferente da atual.",
    path: ["password"],
  });
