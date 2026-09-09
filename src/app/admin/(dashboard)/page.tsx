import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  REGISTRATION_OPEN: "Inscrições abertas",
  REGISTRATION_CLOSED: "Inscrições encerradas",
  IN_PROGRESS: "Em andamento",
  FINISHED: "Encerrado",
};

export default async function AdminHomePage() {
  const session = await auth();
  const tournaments = session?.user
    ? await prisma.tournament.findMany({
        where: { organizerId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { teams: true } } },
      })
    : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Seus torneios</h1>
        <Link
          href="/admin/torneios/novo"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Novo torneio
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Nenhum torneio cadastrado ainda.</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {tournaments.map((t) => (
            <li key={t.id}>
              <Link
                href={`/admin/torneios/${t.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">
                    {STATUS_LABEL[t.status]} · {t._count.teams} equipe(s)
                  </p>
                </div>
                <span className="text-sm text-slate-400">/torneios/{t.slug}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
