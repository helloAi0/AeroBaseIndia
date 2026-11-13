import { describe, expect, it } from "vitest";
import { answer, ASSUME, buildDisruptions, capacityOf, delayMinutes, fmt, isDisrupted, simulate, summarise, toMin } from "./opsEngine";
import { mk } from "../test/fixtures";

describe("time helpers", () => {
  it("toMin/fmt round-trip and wrap past midnight", () => {
    expect(toMin("10:30")).toBe(630);
    expect(fmt(630)).toBe("10:30");
    expect(fmt(1440 + 65)).toBe("01:05");
    expect(fmt(-10)).toBe("23:50");
  });
});

describe("delayMinutes", () => {
  it("prefers the recorded delay, then the issue text, then the default for Delayed", () => {
    expect(delayMinutes(mk({ delay: 42, issue: "Fog 10 min" }))).toBe(42);
    expect(delayMinutes(mk({ issue: "Crew late 25 min" }))).toBe(25);
    expect(delayMinutes(mk({ status: "Delayed" }))).toBe(ASSUME.defaultDelayMin);
    expect(delayMinutes(mk())).toBe(0);
  });
  it("isDisrupted flags cancelled, delayed or any issue", () => {
    expect(isDisrupted(mk({ status: "Cancelled" }))).toBe(true);
    expect(isDisrupted(mk({ issue: "x" }))).toBe(true);
    expect(isDisrupted(mk())).toBe(false);
  });
  it("capacityOf falls back to 180 for unknown aircraft", () => {
    expect(capacityOf(mk({ aircraft: "A380" }))).toBe(520);
    expect(capacityOf(mk({ aircraft: "ZZZ" }))).toBe(180);
  });
});

describe("buildDisruptions", () => {
  it("cancelled flight puts all pax at risk and offers later same-route flights with seats, soonest first", () => {
    const bad = mk({ status: "Cancelled", pax: 120, dep: "10:00" });
    const later = mk({ dep: "12:00", pax: 100 }), soon = mk({ dep: "11:00", pax: 100 });
    const full = mk({ dep: "11:30", pax: 180 }), otherRoute = mk({ dep: "11:15", to: "BLR" });
    const [d] = buildDisruptions([bad, later, soon, full, otherRoute]);
    expect(d.cancelled).toBe(true);
    expect(d.atRisk).toBe(120);
    expect(d.alternatives.map(a => a.flight.id)).toEqual([soon.id, later.id]);
    expect(d.alternatives[0].seats).toBe(80);
  });
  it("small delays break no connections; big delays do; departed flights are ignored", () => {
    const small = mk({ status: "Delayed", delay: 15, pax: 200 });
    const big = mk({ status: "Delayed", delay: 120, pax: 200 });
    const gone = mk({ status: "Departed", issue: "x" });
    const res = buildDisruptions([small, big, gone]);
    expect(res).toHaveLength(2);
    expect(res[0].flight.id).toBe(big.id);          // sorted by risk
    expect(res[0].atRisk).toBeGreaterThan(0);
    expect(res.find(r => r.flight.id === small.id)!.atRisk).toBe(0);
  });
});

describe("simulate (runway queue)", () => {
  const fl = [mk({ dep: "10:00" }), mk({ dep: "10:01" }), mk({ dep: "10:02" })];
  const base = { closeStart: 0, closeMin: 0, capacityPct: 100, extraDelay: 0 };
  it("with ample capacity only queueing delay appears; ordering is preserved", () => {
    const rows = simulate(fl, base);
    expect(rows).toHaveLength(3);
    expect(rows.map(r => r.actual)).toEqual([...rows.map(r => r.actual)].sort((a, b) => a - b));
    expect(rows[0].delay).toBe(0);
  });
  it("a runway closure holds departures until it reopens", () => {
    const rows = simulate(fl, { ...base, closeStart: toMin("09:50"), closeMin: 60 });
    expect(rows.every(r => r.actual >= toMin("10:50"))).toBe(true);
    const s = summarise(rows);
    expect(s.affected).toBe(3);
    expect(s.pax).toBe(450);
    expect(s.worst!.delay).toBeGreaterThanOrEqual(50);
  });
  it("lower capacity increases total delay; only departures from home are simulated", () => {
    const hi = summarise(simulate(fl, base)).total, lo = summarise(simulate(fl, { ...base, capacityPct: 20 })).total;
    expect(lo).toBeGreaterThan(hi);
    expect(simulate([mk({ from: "BOM" })], base)).toHaveLength(0);
    expect(summarise([])).toMatchObject({ total: 0, avg: 0, affected: 0 });
  });
});

describe("copilot answer()", () => {
  const a = mk({ flight: "AI-101", from: "DEL", to: "BOM", status: "Delayed", issue: "Fog 40 min", gate: "A1", dep: "10:30" });
  it("explains a delay for a named flight (with or without dash)", () => {
    expect(answer("why is AI101 late?", [a], 600).text).toContain("Fog 40 min");
    expect(answer("status ai-101", [a], 600).text).toContain("gate A1");
  });
  it("lists free gates and counts delays", () => {
    const busy = mk({ gate: "B3", dep: "10:10" }), idle = mk({ gate: "C9", dep: "20:00" });
    expect(answer("which gates are free in 30 min", [busy, idle], 600).text).toMatch(/C9/);
    expect(answer("how many delayed flights", [a], 600).text).toContain("AI-101");
    expect(answer("how many delayed flights", [mk()], 600).text).toContain("No delayed");
  });
});
