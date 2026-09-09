import { describe, expect, it } from "vitest";
import { nextPowerOfTwo, seedOrder } from "./seeding";

describe("nextPowerOfTwo", () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 4],
    [4, 4],
    [5, 8],
    [7, 8],
    [8, 8],
    [9, 16],
    [16, 16],
    [17, 32],
  ])("nextPowerOfTwo(%i) === %i", (input, expected) => {
    expect(nextPowerOfTwo(input)).toBe(expected);
  });
});

describe("seedOrder", () => {
  it("returns [1] for size 1", () => {
    expect(seedOrder(1)).toEqual([1]);
  });

  it("returns the standard order for size 2, 4, 8, 16", () => {
    expect(seedOrder(2)).toEqual([1, 2]);
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    expect(seedOrder(16)).toEqual([1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11]);
  });

  it("is a permutation of 1..size", () => {
    for (const size of [2, 4, 8, 16, 32]) {
      const order = seedOrder(size);
      expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: size }, (_, i) => i + 1));
    }
  });

  it("pairs seed 1 against seed `size` in round 1", () => {
    for (const size of [2, 4, 8, 16]) {
      const order = seedOrder(size);
      expect(order[0]).toBe(1);
      expect(order[1]).toBe(size);
    }
  });

  it("rejects a non-power-of-two size", () => {
    expect(() => seedOrder(3)).toThrow();
    expect(() => seedOrder(6)).toThrow();
  });
});
