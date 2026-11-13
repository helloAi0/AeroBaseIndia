import { describe, expect, it } from "vitest";
import { carbonOps, CARBON, crowdAt, gateDist, gateReview, gateWide, readyAfter, taxiMinutes, tasksFor } from "./opsEngine2";
import { mk } from "../test/fixtures";

describe("crowdAt", () => {
  it("counts a flight's pax in security only inside its window and caps load at 1", () => {
    const f = mk({ terminal: "T2", dep: "11:00", pax: 800 });
    const now = 10 * 60 + 15;                       // 45 min before departure
    const z = crowdAt([f], now).find(z => z.terminal === "T2" && z.kind === "Security")!;
    expect(z.people).toBe(720); expect(z.load).toBe(1); expect(z.wait).toBe(Math.round(720 / 22));
    const far = crowdAt([f], 4 * 60).find(z => z.terminal === "T2" && z.kind === "Security")!;
    expect(far.people).toBe(0);
    expect(crowdAt([f], now).find(z => z.terminal === "T1" && z.kind === "Security")!.people).toBe(0);
  });
  it("ignores cancelled/departed/landed flights and includes delay in the window", () => {
    const now = 600;
    expect(crowdAt([mk({ terminal: "T1", dep: "10:30", status: "Cancelled" })], now).every(z => z.people === 0)).toBe(true);
    const delayed = mk({ terminal: "T1", dep: "09:30", status: "Delayed", delay: 60 });   // effectively 10:30
    expect(crowdAt([delayed], now).find(z => z.terminal === "T1" && z.kind === "Security")!.people).toBeGreaterThan(0);
  });
});

describe("gates", () => {
  it("gateDist grows with letter then number; E gates are wide-body", () => {
    expect(gateDist("A1")).toBeLessThan(gateDist("B1")); expect(gateDist("A2")).toBeGreaterThan(gateDist("A1"));
    expect(gateWide("E2")).toBe(true); expect(gateWide("A2")).toBe(false);
  });
  it("the later of two clashing flights moves, the boarding/earlier one keeps its gate", () => {
    const early = mk({ gate: "B3", dep: "10:00" }), late = mk({ gate: "B3", dep: "10:20" });
    const issues = gateReview([early, late]);
    expect(issues).toHaveLength(1);
    expect(issues[0].flight.id).toBe(late.id);
    expect(issues[0].proposal).toBeTruthy(); expect(issues[0].proposal).not.toBe("B3");
    const boarding = mk({ gate: "C1", dep: "10:30", status: "Boarding" }), earlier = mk({ gate: "C1", dep: "10:10" });
    expect(gateReview([boarding, earlier]).map(i => i.flight.id)).toEqual([earlier.id]);
  });
  it("flags wide-body on narrow gate and narrow on wide gate with a fitting proposal", () => {
    const wide = mk({ aircraft: "A380", gate: "B1" }), narrow = mk({ aircraft: "A320", gate: "E1", dep: "15:00" });
    const res = gateReview([wide, narrow]);
    const w = res.find(i => i.flight.id === wide.id)!, n = res.find(i => i.flight.id === narrow.id)!;
    expect(w.problems.join()).toMatch(/Wide-body/); expect(gateWide(w.proposal!)).toBe(true);
    expect(n.problems.join()).toMatch(/Narrow-body/); expect(gateWide(n.proposal!)).toBe(false);
  });
  it("no issues for a clean board; departed flights are not reviewed", () => {
    expect(gateReview([mk({ gate: "A1" }), mk({ gate: "B1", dep: "14:00" }), mk({ gate: "A1", status: "Departed" })])).toEqual([]);
  });
});

describe("carbonOps", () => {
  it("matches the published formula and excludes cancelled/landed", () => {
    const f = mk({ gate: "B3", airCode: "AI", airline: "Air India" });
    const r = carbonOps([f, mk({ status: "Cancelled" }), mk({ status: "Landed" })]);
    const expected = Math.round((taxiMinutes("B3") * CARBON.taxiKgPerMin * CARBON.singleEngineSaving + CARBON.groundPowerMin * CARBON.apuKgPerMin) * CARBON.co2PerKg);
    expect(r.rows).toHaveLength(1); expect(r.total).toBe(expected);
    expect(r.byAirline).toEqual([{ code: "AI", name: "Air India", flights: 1, co2: expected }]);
  });
});

describe("turnaround critical path", () => {
  it("wide-body has longer tasks than narrow-body", () => {
    expect(readyAfter(tasksFor(true), {}).ready).toBeGreaterThan(readyAfter(tasksFor(false), {}).ready);
  });
  it("narrow-body baseline: deplane 12 → clean 15 → board 22 = 49", () => {
    const { ready, finish } = readyAfter(tasksFor(false), {});
    expect(finish.board).toBe(49); expect(ready).toBe(49);
  });
  it("slip on a critical task delays readiness one-for-one; slip on a non-critical task does not", () => {
    const base = readyAfter(tasksFor(false), {}).ready;
    expect(readyAfter(tasksFor(false), { clean: 10 }).ready).toBe(base + 10);
    expect(readyAfter(tasksFor(false), { cater: 3 }).ready).toBe(base);
    expect(readyAfter(tasksFor(false), { fuel: 30 }).ready).toBeGreaterThan(base);      // fuel + 5 safety buffer
  });
});
