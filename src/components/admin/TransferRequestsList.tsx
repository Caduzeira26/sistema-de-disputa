import { decideTransferRequest } from "@/lib/actions/transfers";

type TransferRequestItem = {
  id: string;
  requestedByName: string;
  requestedByContact: string | null;
  createdAt: Date;
  athlete: { name: string };
  fromTeam: { name: string } | null;
  toTeam: { name: string };
};

export function TransferRequestsList({ requests }: { requests: TransferRequestItem[] }) {
  if (requests.length === 0) {
    return <p className="text-sm text-slate-500">Nenhuma solicitação de transferência pendente.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((request) => (
        <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
          <div>
            <p className="text-sm font-medium text-slate-900">{request.athlete.name}</p>
            <p className="text-xs text-slate-500">
              {request.fromTeam ? `${request.fromTeam.name} → ${request.toTeam.name}` : `→ ${request.toTeam.name}`}
            </p>
            <p className="text-xs text-slate-400">
              Solicitado por {request.requestedByName}
              {request.requestedByContact ? ` (${request.requestedByContact})` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <form action={decideTransferRequest}>
              <input type="hidden" name="transferRequestId" value={request.id} />
              <input type="hidden" name="decision" value="APPROVED" />
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Aprovar
              </button>
            </form>
            <form action={decideTransferRequest}>
              <input type="hidden" name="transferRequestId" value={request.id} />
              <input type="hidden" name="decision" value="REJECTED" />
              <button
                type="submit"
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Rejeitar
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
