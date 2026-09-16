import { describe, expect, it } from "vitest";
import { nextPowerOfTwo, prevPowerOfTwo } from "./seeding";

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

describe("prevPowerOfTwo", () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 2],
    [4, 4],
    [5, 4],
    [8, 8],
    [9, 8],
    [15, 8],
    [16, 16],
    [17, 16],
  ])("prevPowerOfTwo(%i) === %i", (input, expected) => {
    expect(prevPowerOfTwo(input)).toBe(expected);
  });
});
