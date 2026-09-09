import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Sistema de Disputa</h1>
      <p className="max-w-md text-sm text-slate-500">
        Gestão de torneios esportivos: inscrições, chaveamento, agenda, súmulas e estatísticas.
      </p>
      <Link
        href="/admin/login"
        className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Área do organizador
      </Link>
    </main>
  );
}
