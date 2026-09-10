import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformOwner } from "@/lib/assistant";

export default async function AssistantConversationsPage() {
  const session = await auth();
  if (!isPlatformOwner(session?.user?.email)) notFound();

  const conversations = await prisma.assistantConversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Conversas do assistente</h1>
      <p className="mt-1 text-sm text-slate-500">Mensagens de visitantes do site com o assistente virtual.</p>

      {conversations.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Nenhuma conversa ainda.</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/assistente/${c.id}`} className="block px-4 py-3 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">
                    {c.messages[0]?.content.slice(0, 80) ?? "(sem mensagens)"}
                  </p>
                  <span className="shrink-0 text-xs text-slate-400">
                    {c.updatedAt.toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{c._count.messages} mensagem(ns)</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
