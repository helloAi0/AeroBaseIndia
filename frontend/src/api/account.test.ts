import { describe, it, expect } from "vitest";
import { passwordProblem } from "./account";

describe("passwordProblem", () => {
  it("rejects short, letter-only and number-only passwords", () => {
    expect(passwordProblem("abc123")).toMatch(/10/);
    expect(passwordProblem("onlyletterslong")).toMatch(/number/);
    expect(passwordProblem("1234567890123")).toMatch(/letter/);
  });
  it("accepts a strong one", () => { expect(passwordProblem("Sup3rsecret99")).toBe(""); });
});
