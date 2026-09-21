interface PodiumTeam {
  id: string;
  name: string;
}

interface FinalPodiumProps {
  champion: PodiumTeam | null;
  runnerUp: PodiumTeam | null;
  thirdPlace: PodiumTeam[];
}

export function FinalPodium({ champion, runnerUp, thirdPlace }: FinalPodiumProps) {
  if (!champion) return null;

  return (
    <div className="mt-4 flex flex-col gap-1 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
      <p>🥇 Campeão: {champion.name}</p>
      {runnerUp && <p>🥈 Vice-campeão: {runnerUp.name}</p>}
      {thirdPlace.length > 0 && (
        <p>
          🥉 {thirdPlace.length > 1 ? "3º lugar (empate)" : "3º lugar"}: {thirdPlace.map((t) => t.name).join(" e ")}
        </p>
      )}
    </div>
  );
}
