import { describe, it, expect } from "vitest";
import { businessAnswer, scopeOf } from "./opsInsights";

const F = (flight: string, airCode: string, airline: string, pax: number, status = "Scheduled", aircraft = "A320") =>
  ({ flight, airCode, airline, pax, status, aircraft, from: "DEL", to: "BOM", dep: "10:00", arr: "12:00", gate: "A1", terminal: "T3" }) as never;
const board = [F("AI-101", "AI", "Air India", 150), F("AI-102", "AI", "Air India", 170, "Delayed"), F("6E-201", "6E", "IndiGo", 180)];
const mk = (role: string, staffLevel?: string) => ({ viewer: { role, staffLevel }, airport: "DEL" });

describe("Copilot business questions", () => {
  it("director gets airline totals", () => {
    const a = businessAnswer("how many passengers have booked Air India today?", board, mk("airport_admin"))!;
    expect(a.text).toMatch(/Air India at DEL today: 2 flights, about 320 passengers/); expect(a.text).toMatch(/1 delayed/);
  });
  it("director gets a ranking and overall summary", () => {
    expect(businessAnswer("which is the busiest airline", board, mk("superadmin"))!.text).toMatch(/1\. Air India/);
    expect(businessAnswer("total flights today", board, mk("airport_admin"))!.text).toMatch(/3 flights across 2 airlines/);
  });
  it("passengers, shop owners and ground staff are refused", () => {
    for (const r of ["passenger", "retailer", "staff"]) {
      const a = businessAnswer("how many tickets were sold today and what is the total revenue", board, mk(r, r === "staff" ? "ground" : undefined))!;
      expect(a.text).toMatch(/airport management/); expect(a.text).not.toMatch(/\d{3}/);
    }
  });
  it("airline staff only see their own airline and no revenue", () => {
    const v = mk("staff", "airline_AI");
    expect(scopeOf(v.viewer)).toEqual({ kind: "airline", code: "AI" });
    expect(businessAnswer("passengers on IndiGo", board, v)!.text).toMatch(/your own airline/);
    expect(businessAnswer("passengers today", board, v)!.text).toMatch(/Air India/);
    expect(businessAnswer("total revenue", board, v)!.text).toMatch(/management/);
  });
  it("revenue comes from recorded payments, never invented", () => {
    expect(businessAnswer("total revenue", board, { ...mk("airport_admin"), revenue: { paid: 0, paidCount: 0, pending: 0, pendingCount: 0, currency: "INR" } })!.text).toMatch(/No payments have been recorded/);
    expect(businessAnswer("total revenue", board, { ...mk("airport_admin"), revenue: { paid: 125000, paidCount: 3, pending: 0, pendingCount: 0, currency: "INR" } })!.text).toMatch(/₹1,25,000/);
  });
  it("ignores non-business questions", () => { expect(businessAnswer("which gates are free", board, mk("airport_admin"))).toBeNull(); });
});
