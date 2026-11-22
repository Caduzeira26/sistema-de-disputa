/**
 * Who operates the service, as shown on the legal pages. The legal name, CNPJ
 * and contact e-mail come from the environment so they can be filled in (and
 * kept out of the repository) without a code change; a missing value simply
 * drops that line from the page.
 */
export const BUSINESS = {
  brand: "Sistema de Disputa",
  operator: "Digita Money",
  legalName: process.env.COMPANY_LEGAL_NAME?.trim() || null,
  cnpj: process.env.COMPANY_CNPJ?.trim() || null,
  contactEmail: process.env.CONTACT_EMAIL?.trim() || null,
} as const;

/** Date the current Termos de Uso and Política de Privacidade took effect. */
export const LEGAL_UPDATED_AT = "27 de outubro de 2026";

/** Public WhatsApp of Digita Money (the same one on digitamoney.com.br), used for plans that are sold by talking to the team. */
export const WHATSAPP_NUMBER = "554399680406";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
