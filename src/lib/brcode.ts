/**
 * Static PIX "BR Code" (the EMV payload behind a PIX QR code / "copia e cola"),
 * following the Banco Central spec. Used for the organizer's manual PIX key:
 * the payload carries the key and, optionally, the amount, so the payer's bank
 * app fills everything in on scan.
 */

/** CRC16-CCITT (poly 0x1021, init 0xFFFF), as required by the BR Code spec. */
export function crc16(text: string): string {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const nums = digits.split("").map(Number);
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += nums[i] * (length + 1 - i);
    const rest = sum % 11;
    if (nums[length] !== (rest < 2 ? 0 : 11 - rest)) return false;
  }
  return true;
}

/**
 * Key in the form the BR Code expects. People type keys in many ways, so this
 * recognises e-mail, random key (UUID), CNPJ, CPF and phone. An 11-digit
 * number that is a valid CPF is a CPF; otherwise it's a Brazilian mobile phone
 * (DDD + 9 digits) and gets the "+55" prefix.
 */
export function pixKeyForBrCode(rawKey: string): string {
  const key = rawKey.trim();
  if (key.includes("@")) return key.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return key.toLowerCase();

  const digits = key.replace(/\D/g, "");
  if (key.startsWith("+")) return `+${digits}`;
  if (digits.length === 14) return digits; // CNPJ
  if (digits.length === 11) return isValidCpf(digits) ? digits : `+55${digits}`;
  if (digits.length === 10) return `+55${digits}`; // landline with DDD
  if (digits.length === 13 && digits.startsWith("55")) return `+${digits}`;
  return key;
}

/** Uppercase ASCII letters, digits and spaces only, as the spec's text fields allow in practice. */
function sanitizeText(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

function field(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

export function buildPixPayload(params: {
  key: string;
  /** Receiver name shown by some bank apps; falls back to a generic label. */
  holder?: string | null;
  city?: string;
  /** Optional fixed amount; leave out to let the payer type it. */
  amountCents?: number | null;
  /** Reconciliation id; "***" means none (the standard value for static codes). */
  txid?: string;
}): string {
  const merchantAccount = field("00", "br.gov.bcb.pix") + field("01", pixKeyForBrCode(params.key));
  const name = sanitizeText(params.holder ?? "", 25) || "RECEBEDOR";
  const city = sanitizeText(params.city ?? "BRASIL", 15) || "BRASIL";
  const txid = (params.txid ?? "***").replace(/[^A-Za-z0-9*]/g, "").slice(0, 25) || "***";

  const body =
    field("00", "01") +
    field("26", merchantAccount) +
    field("52", "0000") +
    field("53", "986") +
    (params.amountCents && params.amountCents > 0 ? field("54", (params.amountCents / 100).toFixed(2)) : "") +
    field("58", "BR") +
    field("59", name) +
    field("60", city) +
    field("62", field("05", txid)) +
    "6304";

  return body + crc16(body);
}
