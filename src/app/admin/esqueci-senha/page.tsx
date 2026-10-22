import Link from "next/link";
import { ForgotPasswordForm } from "@/components/admin/ForgotPasswordForm";
import { BrandFooter } from "@/components/BrandFooter";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Esqueci a senha</h1>
          <p className="mb-6 text-sm text-slate-500">
            Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
          </p>
          <ForgotPasswordForm />
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link href="/admin/login" className="font-medium text-slate-700 underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
