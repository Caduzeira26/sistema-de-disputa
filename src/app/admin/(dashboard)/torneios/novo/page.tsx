import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreateTournamentForm } from "@/components/admin/CreateTournamentForm";
import { BrandFooter } from "@/components/BrandFooter";
import { countTournamentsForLimit, getPlanLimits, isWithinTournamentLimit } from "@/lib/plans";

export default async function NewTournamentPage() {
  const session = await auth();
  if (!session?.user) notFound();

  const limits = await getPlanLimits(session.user.id);
  const usedCount = await countTournamentsForLimit(session.user.id, limits);
  const atLimit = !isWithinTournamentLimit(limits, usedCount);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Novo torneio</h1>
      <p className="mt-1 text-sm text-slate-500">
        Depois de criado, você poderá abrir as inscrições e compartilhar o link público com as equipes.
      </p>

      {atLimit ? (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Você atingiu o limite de campeonatos do seu plano atual.{" "}
          <Link href="/planos" className="underline">
            Veja os planos disponíveis
          </Link>
          .
        </div>
      ) : (
        <div className="mt-6">
          <CreateTournamentForm allowedSports={limits.allowedSports} />
        </div>
      )}

      <BrandFooter />
    </div>
  );
}
