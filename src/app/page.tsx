import Link from "next/link";
import { BrandFooter } from "@/components/BrandFooter";
import { AssistantWidget } from "@/components/AssistantWidget";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Sistema de Disputa</h1>
        <p className="max-w-md text-sm text-slate-500">
          Gestão de torneios esportivos: inscrições, chaveamento, agenda, súmulas e estatísticas.
        </p>
        <div className="mt-2 flex gap-3">
          <Link
            href="/admin/login"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Área do organizador
          </Link>
          <Link
            href="/planos"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver planos
          </Link>
        </div>
      </main>
      <BrandFooter />
      <AssistantWidget />
    </div>
  );
}
