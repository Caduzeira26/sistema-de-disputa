import { CreateTournamentForm } from "@/components/admin/CreateTournamentForm";

export default function NewTournamentPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Novo torneio</h1>
      <p className="mt-1 text-sm text-slate-500">
        Depois de criado, você poderá abrir as inscrições e compartilhar o link público com as equipes.
      </p>
      <div className="mt-6">
        <CreateTournamentForm />
      </div>
    </div>
  );
}
