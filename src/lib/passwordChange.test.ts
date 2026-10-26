import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "./passwordChange";

const valid = { currentPassword: "antiga123", password: "nova12345", confirmPassword: "nova12345" };

describe("changePasswordSchema", () => {
  it("accepts a valid change", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the current password", () => {
    expect(changePasswordSchema.safeParse({ ...valid, currentPassword: "" }).success).toBe(false);
  });

  it("rejects a new password shorter than 6 characters", () => {
    const result = changePasswordSchema.safeParse({ ...valid, password: "abc", confirmPassword: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects when the confirmation doesn't match", () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: "outra12345" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("rejects reusing the current password", () => {
    const result = changePasswordSchema.safeParse({ ...valid, password: "antiga123", confirmPassword: "antiga123" });
    expect(result.success).toBe(false);
  });
});
