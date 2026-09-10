import Link from "next/link";
import { SignupForm } from "@/components/admin/SignupForm";
import { BrandFooter } from "@/components/BrandFooter";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Criar conta de organizador</h1>
          <p className="mb-6 text-sm text-slate-500">Cadastre-se para criar campeonatos e assinar um plano.</p>
          <SignupForm />
          <p className="mt-4 text-center text-sm text-slate-500">
            Já tem conta?{" "}
            <Link href="/admin/login" className="font-medium text-slate-700 underline">
              Entrar
            </Link>
          </p>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
