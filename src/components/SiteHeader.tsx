import Image from "next/image";
import Link from "next/link";

/** Top bar for the public pages (home, plans): logo, links and a gradient call to action. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/digitamoney-icon-v2.png" alt="" width={560} height={560} className="h-9 w-9" priority />
          <span className="font-display text-sm font-bold tracking-tight text-slate-900">
            Sistema de <span className="bg-gradient-to-r from-[#35e0b0] to-[#3fa9ff] bg-clip-text text-transparent">Disputa</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium text-slate-600 sm:gap-3">
          <Link href="/planos" className="rounded-full px-3 py-1.5 hover:text-slate-900">
            Planos
          </Link>
          <Link href="/admin/login" className="rounded-full px-3 py-1.5 hover:text-slate-900">
            Entrar
          </Link>
          <Link href="/admin/signup" className="hidden rounded-full bg-slate-900 px-4 py-2 text-sm text-white sm:inline-block">
            Criar conta grátis
          </Link>
        </nav>
      </div>
    </header>
  );
}
