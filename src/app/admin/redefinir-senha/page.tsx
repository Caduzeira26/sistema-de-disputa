import Link from "next/link";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";
import { BrandFooter } from "@/components/BrandFooter";
import { prisma } from "@/lib/db";
import { hashResetToken, isResetTokenUsable } from "@/lib/passwordReset";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const record = token
    ? await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) } })
    : null;
  const valid = Boolean(token && record && isResetTokenUsable(record));

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Criar nova senha</h1>
          {valid && token ? (
            <>
              <p className="mb-6 text-sm text-slate-500">Escolha a senha que você vai usar para entrar.</p>
              <ResetPasswordForm token={token} />
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-red-600">Este link expirou, já foi usado ou é inválido.</p>
              <Link href="/admin/esqueci-senha" className="text-sm font-medium text-slate-700 underline">
                Pedir um novo link
              </Link>
            </>
          )}
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
