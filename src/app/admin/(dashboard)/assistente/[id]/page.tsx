import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformOwner } from "@/lib/assistant";

export default async function AssistantConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isPlatformOwner(session?.user?.email)) notFound();

  const { id } = await params;
  const conversation = await prisma.assistantConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) notFound();

  return (
    <div>
      <Link href="/admin/assistente" className="text-sm text-slate-500 underline">
        ← Conversas
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Conversa</h1>
      <p className="mt-1 text-sm text-slate-500">Iniciada em {conversation.createdAt.toLocaleString("pt-BR")}</p>

      <div className="mt-6 flex flex-col gap-3">
        {conversation.messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-2xl rounded-lg px-4 py-3 text-sm ${
              m.role === "user" ? "bg-slate-900 text-white" : "mr-auto bg-slate-100 text-slate-700"
            }`}
          >
            <p className="mb-1 text-xs opacity-60">{m.role === "user" ? "Visitante" : "Assistente"}</p>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
