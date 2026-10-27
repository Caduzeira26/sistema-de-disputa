import Link from "next/link";
import { BrandFooter } from "@/components/BrandFooter";
import { LEGAL_UPDATED_AT } from "@/lib/business";

/** Shared frame for the Termos de Uso and Política de Privacidade pages. */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <Link href="/" className="text-sm text-slate-500 underline">
          Voltar ao início
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Última atualização: {LEGAL_UPDATED_AT}</p>
        <p className="mt-6 text-slate-700">{intro}</p>
        <div className="mt-8 flex flex-col gap-8">{children}</div>
      </main>
      <BrandFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-slate-700 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
