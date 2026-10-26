import { auth } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default async function AccountPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-slate-900">Minha conta</h1>
      <p className="mt-1 text-sm text-slate-500">{session?.user?.email}</p>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Alterar senha</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
