export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Envio de e-mail não está configurado (RESEND_API_KEY ou EMAIL_FROM ausente).");
    this.name = "EmailNotConfiguredError";
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Base URL used in links inside e-mails. Never derived from request headers, which a caller could forge. */
export function getAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export async function sendEmail(params: { to: string; subject: string; html: string; text: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new EmailNotConfiguredError();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html, text: params.text }),
  });

  if (!res.ok) {
    throw new Error(`Resend respondeu ${res.status}: ${await res.text()}`);
  }
}

export function buildPasswordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Redefinir sua senha — Sistema de Disputa",
    text: `Recebemos um pedido para redefinir a senha da sua conta no Sistema de Disputa.\n\nAbra o link abaixo para criar uma nova senha (válido por 1 hora, uso único):\n${resetUrl}\n\nSe você não pediu isso, ignore este e-mail — sua senha continua a mesma.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#0f172a">
  <h2 style="margin-bottom:8px">Redefinir sua senha</h2>
  <p>Recebemos um pedido para redefinir a senha da sua conta no Sistema de Disputa.</p>
  <p style="margin:24px 0"><a href="${resetUrl}" style="background:#0f172a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">Criar nova senha</a></p>
  <p style="font-size:13px;color:#475569">O link vale por 1 hora e só pode ser usado uma vez. Se o botão não funcionar, copie este endereço no navegador:<br>${resetUrl}</p>
  <p style="font-size:13px;color:#475569">Se você não pediu isso, ignore este e-mail — sua senha continua a mesma.</p>
</div>`,
  };
}
