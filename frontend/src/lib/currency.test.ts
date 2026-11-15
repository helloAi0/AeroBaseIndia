import { describe, expect, it } from "vitest";
import { currencyFor, fromInr, money } from "./currency";
describe("currency", () => {
  it("uses rupees for Indian airports and local money abroad", () => {
    expect(currencyFor("DEL").code).toBe("INR"); expect(currencyFor("DXB").code).toBe("AED"); expect(currencyFor("LHR").code).toBe("GBP");
    expect(fromInr(2400, currencyFor("DXB"))).toBe("AED 100"); expect(fromInr(11200, currencyFor("LHR"))).toBe("£100");
    expect(money(1500, currencyFor("DEL"))).toBe("₹1,500"); expect(money(12.5, currencyFor("DXB"))).toBe("AED 12.50");
  });
});
