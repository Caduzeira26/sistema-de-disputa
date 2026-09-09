export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(n));
}

/**
 * Standard bracket seeding order: for a bracket of `size` slots, returns the
 * seed number (1-indexed) that belongs in each position, so that top seeds
 * meet as late as possible. E.g. size=8 -> [1,8,4,5,2,7,3,6].
 */
export function seedOrder(size: number): number[] {
  if (size <= 0 || (size & (size - 1)) !== 0) {
    throw new Error(`seedOrder: size must be a power of two, got ${size}`);
  }
  if (size === 1) return [1];

  const prev = seedOrder(size / 2);
  const result: number[] = [];
  for (const s of prev) {
    result.push(s, size + 1 - s);
  }
  return result;
}
