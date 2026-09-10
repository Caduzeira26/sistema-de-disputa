import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { AssistantNotConfiguredError, buildSystemPrompt } from "@/lib/assistant";

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

// Caps keep a public, unauthenticated endpoint from being used to run up an
// unbounded API bill — this isn't full rate limiting, just a sane ceiling.
const chatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Assistente indisponível no momento. Fale com a gente pelo WhatsApp ou e-mail." },
      { status: 200 }
    );
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: parsed.data.messages,
    });

    const reply = response.content.find((block) => block.type === "text");
    if (!reply || reply.type !== "text") {
      return NextResponse.json({ error: "Não consegui gerar uma resposta agora. Tente de novo." }, { status: 200 });
    }

    return NextResponse.json({ reply: reply.text });
  } catch (err) {
    if (err instanceof AssistantNotConfiguredError) {
      return NextResponse.json({ error: "Assistente indisponível no momento." }, { status: 200 });
    }
    console.error("[assistant] failed to generate a reply", err);
    return NextResponse.json({ error: "Não consegui responder agora. Tente novamente em instantes." }, { status: 200 });
  }
}
