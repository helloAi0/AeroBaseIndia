import { describe, expect, it } from "vitest";
import { hasVoice, LANG_BCP47, LANG_NAME, translate } from "./announceI18n";

describe("announcement translations", () => {
  it("every supported language has a locale and a display name", () => {
    for (const l of ["EN", "HI", "GU", "PU", "TA"]) { expect(LANG_BCP47[l]).toMatch(/^[a-z]{2}-IN$/); expect(LANG_NAME[l]).toBeTruthy(); }
  });
  it("interpolates flight and gate into translated text and uses the right script", () => {
    const hi = translate("Boarding", "HI", "AI-101", "A4")!;
    expect(hi).toContain("AI-101"); expect(hi).toContain("A4"); expect(hi).toMatch(/[ऀ-ॿ]/);
    expect(translate("Boarding", "TA", "AI-101", "A4")!).toMatch(/[஀-௿]/);
    expect(translate("Boarding", "GU", "AI-101", "A4")!).toMatch(/[઀-૿]/);
    expect(translate("Boarding", "PU", "AI-101", "A4")!).toMatch(/[਀-੿]/);
  });
  it("returns undefined for English and unknown types", () => {
    expect(translate("Boarding", "EN", "x", "y")).toBeUndefined();
    expect(translate("Nope", "HI", "x", "y")).toBeUndefined();
  });
  it("hasVoice is false when speech synthesis is unavailable", () => { expect(hasVoice("HI")).toBe(false); });
});
