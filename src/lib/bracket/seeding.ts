export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(n));
}

export function prevPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  return 2 ** Math.floor(Math.log2(n));
}
