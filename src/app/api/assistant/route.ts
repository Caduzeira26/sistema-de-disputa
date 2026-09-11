import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { AssistantNotConfiguredError, buildRegistrationSystemPrompt, buildSystemPrompt } from "@/lib/assistant";
import { getPlanLimits } from "@/lib/plans";

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

// Caps keep a public, unauthenticated endpoint from being used to run up an
// unbounded API bill — this isn't full rate limiting, just a sane ceiling.
const chatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
  conversationId: z.string().min(1).nullable().optional(),
  context: z.enum(["SALES", "REGISTRATION"]).optional().default("SALES"),
  // Only meaningful (and required) for REGISTRATION — which tournament's
  // form is being filled. Facts about it are looked up server-side below,
  // never trusted from the client.
  tournamentId: z.string().min(1).nullable().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 });
  }

  // The client always sends the full history; only the newest message is new to us.
  const latestUserMessage = parsed.data.messages[parsed.data.messages.length - 1];

  const existingConversation = parsed.data.conversationId
    ? await prisma.assistantConversation.findUnique({ where: { id: parsed.data.conversationId } })
    : null;
  // Context/tournament are pinned at conversation creation — an existing
  // conversation keeps its own, ignoring whatever the client sends on
  // later turns, so a chat can't be redirected mid-stream.
  const context = existingConversation?.context ?? parsed.data.context;
  const tournamentId = existingConversation ? existingConversation.tournamentId : parsed.data.tournamentId || null;

  if (context === "REGISTRATION" && !tournamentId) {
    return NextResponse.json({ error: "Campeonato não identificado." }, { status: 400 });
  }

  const conversation =
    existingConversation ??
    (await prisma.assistantConversation.create({ data: { context, tournamentId } }));
  const conversationId = conversation.id;

  await prisma.assistantMessage.create({
    data: { conversationId, role: latestUserMessage.role, content: latestUserMessage.content },
  });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Assistente indisponível no momento. Fale com a gente pelo WhatsApp ou e-mail.", conversationId },
      { status: 200 }
    );
  }

  let systemPrompt: string;
  if (context === "REGISTRATION") {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId! } });
    if (!tournament) {
      return NextResponse.json({ error: "Campeonato não encontrado.", conversationId }, { status: 200 });
    }
    const limits = await getPlanLimits(tournament.organizerId);
    systemPrompt = buildRegistrationSystemPrompt(tournament, limits);
  } else {
    systemPrompt = buildSystemPrompt();
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: parsed.data.messages,
    });

    const reply = response.content.find((block) => block.type === "text");
    if (!reply || reply.type !== "text") {
      return NextResponse.json(
        { error: "Não consegui gerar uma resposta agora. Tente de novo.", conversationId },
        { status: 200 }
      );
    }

    await prisma.assistantMessage.create({
      data: { conversationId, role: "assistant", content: reply.text },
    });

    return NextResponse.json({ reply: reply.text, conversationId });
  } catch (err) {
    if (err instanceof AssistantNotConfiguredError) {
      return NextResponse.json(
        { error: "Assistente indisponível no momento.", conversationId },
        { status: 200 }
      );
    }
    console.error("[assistant] failed to generate a reply", err);
    return NextResponse.json(
      { error: "Não consegui responder agora. Tente novamente em instantes.", conversationId },
      { status: 200 }
    );
  }
}
