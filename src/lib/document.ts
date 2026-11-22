/** CPF / CNPJ helpers (digits only, with check-digit validation). */

export function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidCpf(raw: string): boolean {
  const digits = onlyDigits(raw);
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

export function isValidCnpj(raw: string): boolean {
  const digits = onlyDigits(raw);
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  const nums = digits.split("").map(Number);
  const check = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + nums[i] * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return nums[12] === check(12) && nums[13] === check(13);
}

/** Digits of a valid CPF or CNPJ, or null when it isn't one. */
export function normalizeCpfCnpj(raw: string): string | null {
  const digits = onlyDigits(raw);
  if (digits.length === 11 && isValidCpf(digits)) return digits;
  if (digits.length === 14 && isValidCnpj(digits)) return digits;
  return null;
}
