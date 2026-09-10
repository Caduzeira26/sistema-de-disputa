import { LoginForm } from "@/components/admin/LoginForm";
import { BrandFooter } from "@/components/BrandFooter";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Área do organizador</h1>
          <p className="mb-6 text-sm text-slate-500">Entre com suas credenciais para gerenciar torneios.</p>
          <LoginForm />
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
