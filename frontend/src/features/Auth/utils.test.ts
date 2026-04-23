import { describe, expect, it } from "vitest";

import { validateLoginForm } from "@/features/Auth/utils";

describe("validateLoginForm", () => {
  it("returns null for valid credentials", () => {
    expect(
      validateLoginForm({
        email: "admin@demo.com",
        password: "secret123",
      }),
    ).toBeNull();
  });

  it("returns required error when values are empty", () => {
    expect(validateLoginForm({ email: "", password: "" })).toBe("Email and password are required.");
  });

  it("returns format error for invalid email", () => {
    expect(validateLoginForm({ email: "invalid-email", password: "secret123" })).toBe(
      "Email format is invalid.",
    );
  });
});
