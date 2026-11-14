import { describe, it, expect } from "vitest";
import { boardingTime, hhmm, paxRef, stageIndex, inr } from "./booking";
describe("booking helpers", () => {
  it("boarding is 40 minutes before departure, across midnight too", () => { expect(boardingTime("2026-11-14T09:30:00")).toBe("08:50"); expect(boardingTime("00:20")).toBe("23:40"); });
  it("formats time and money", () => { expect(hhmm("2026-11-14T09:30:00")).toBe("09:30"); expect(inr(12345)).toBe("₹12,345"); });
  it("derives a short passenger reference from the user id", () => { expect(paxRef("ab12cd34-0000-0000-0000-000000000000")).toBe("PAX-AB12CD"); expect(paxRef(undefined)).toBe(""); });
  it("orders stages", () => { expect(stageIndex("Security cleared")).toBe(3); expect(stageIndex("nope")).toBe(0); });
});
