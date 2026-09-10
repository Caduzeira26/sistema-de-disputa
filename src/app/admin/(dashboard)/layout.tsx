import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { isPlatformOwner } from "@/lib/assistant";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/admin" className="text-slate-900">
              Torneios
            </Link>
            <Link href="/planos" className="hover:text-slate-900">
              Planos
            </Link>
            {isPlatformOwner(session?.user?.email) && (
              <Link href="/admin/assistente" className="hover:text-slate-900">
                Assistente
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{session?.user?.name ?? session?.user?.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
