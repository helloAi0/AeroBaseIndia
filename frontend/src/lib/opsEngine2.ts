/** Transparent planning models for crowd, gates, carbon and turnaround. Assumptions are exported and shown in the UI. */
import type { DemoFlight } from "../data/airportFlights";
import { capacityOf, delayMinutes, toMin } from "./opsEngine";

/* ───────── Crowd ───────── */
export const CROWD = { checkinLeadMin: 150, securityLeadMin: 90, checkinPaxPerMin: 14, securityPaxPerMin: 22, checkinCap: 900, securityCap: 700 };
/** Counters / lanes: the default staffing reproduces the throughput above; each extra lane adds its share. Target = the longest wait we want to tolerate. */
export const LANES = {
  "Check-in": { def: 12, max: 40, target: 20, rate: CROWD.checkinPaxPerMin / 12 },
  Security:   { def: 12, max: 24, target: 15, rate: CROWD.securityPaxPerMin / 12 },
} as const;
export interface Zone { terminal: string; kind: "Check-in" | "Security" | "Gates"; people: number; wait: number; load: number; lanes?: number; recommended?: number }
export const laneKey = (terminal: string, kind: string) => `${terminal}|${kind}`;

/** Passengers expected in a zone at `now`, spreading each flight's pax across the window before departure. `lanes` overrides the counters open per "T1|Check-in". */
export function crowdAt(flights: DemoFlight[], now: number, lanes: Record<string, number> = {}, terminals: string[] = ["T1", "T2", "T3"]): Zone[] {
  const out: Zone[] = [];
  for (const t of terminals) {
    const fs = flights.filter(f => f.terminal === t && f.status !== "Landed" && f.status !== "Departed" && f.status !== "Cancelled");
    const inWindow = (f: DemoFlight, lead: number, tail: number) => { const d = toMin(f.dep) + delayMinutes(f) - now; return d <= lead && d >= tail; };
    const ci = fs.filter(f => inWindow(f, CROWD.checkinLeadMin, 45)).reduce((a, f) => a + f.pax * 0.9, 0);
    const sec = fs.filter(f => inWindow(f, CROWD.securityLeadMin, 25)).reduce((a, f) => a + f.pax * 0.9, 0);
    const gt = fs.filter(f => inWindow(f, 45, -10)).reduce((a, f) => a + f.pax, 0);
    const zone = (kind: "Check-in" | "Security", people: number): Zone => {
      const L = LANES[kind], n = Math.max(1, Math.min(L.max, lanes[laneKey(t, kind)] ?? L.def));
      return { terminal: t, kind, people: Math.round(people), wait: Math.round(people / (n * L.rate)), load: Math.min(1, people / (n * L.rate * L.target * 2)), lanes: n,
        recommended: Math.max(4, Math.min(L.max, Math.ceil(people / (L.rate * L.target)))) };
    };
    out.push(zone("Check-in", ci), zone("Security", sec));
    out.push({ terminal: t, kind: "Gates", people: Math.round(gt), wait: 0, load: Math.min(1, gt / 700) });
  }
  return out;
}

/* ───────── Gates ───────── */
export const gateDist = (g: string) => Math.max(0, (g.charCodeAt(0) - 65)) * 2 + (parseInt(g.slice(1)) || 0) * 0.3;   // relative walking cost
export const gateWide = (g: string) => g.startsWith("E");                                                     // E gates take wide-bodies
export interface GateIssue { flight: DemoFlight; gate: string; problems: string[]; proposal?: string; gain?: string }

const clash = (a: DemoFlight, b: DemoFlight) => a.id !== b.id && Math.abs(toMin(a.dep) - toMin(b.dep)) < 50;

export function gateReview(flights: DemoFlight[]): GateIssue[] {
  const active = flights.filter(f => f.status === "Scheduled" || f.status === "Boarding" || f.status === "Delayed")
    .sort((a, b) => toMin(a.dep) - toMin(b.dep) || a.id - b.id);
  const allGates = Array.from(new Set(flights.map(f => f.gate).concat(["A5", "B7", "C3", "E3"])));
  const eff = new Map<number, string>(active.map(f => [f.id, f.gate]));   // gate after any proposed move
  const issues: GateIssue[] = [];
  for (const f of active) {
    const problems: string[] = [];
    const big = capacityOf(f) >= 300;
    // earlier (or boarding) flights keep the gate; the later one is the one that moves
    if (active.some(o => o.id !== f.id && eff.get(o.id) === eff.get(f.id) && clash(f, o) && (o.status === "Boarding" || toMin(o.dep) < toMin(f.dep) || (toMin(o.dep) === toMin(f.dep) && o.id < f.id))))
      problems.push("Gate double-booked within 50 min");
    if (big && !gateWide(f.gate)) problems.push("Wide-body on a narrow-body gate");
    if (!big && gateWide(f.gate)) problems.push("Narrow-body occupying a wide-body gate");
    if (!problems.length) continue;
    const ok = allGates.filter(g => g !== f.gate && (big ? gateWide(g) : !gateWide(g)) && !active.some(o => o.id !== f.id && eff.get(o.id) === g && clash(f, o)))
      .sort((a, b) => gateDist(a) - gateDist(b));
    const prop = ok[0];
    if (prop) { eff.set(f.id, prop); const d = Math.round((gateDist(prop) - gateDist(f.gate)) * 40); issues.push({ flight: f, gate: f.gate, problems, proposal: prop, gain: d === 0 ? "same walk" : `walk ${Math.abs(d)} m ${d < 0 ? "shorter" : "longer"}` }); }
    else issues.push({ flight: f, gate: f.gate, problems });
  }
  return issues;
}

/* ───────── Carbon ops ───────── */
export const CARBON = { co2PerKg: 3.16, taxiKgPerMin: 12, singleEngineSaving: 0.35, apuKgPerMin: 2.2, groundPowerMin: 35 };
export const taxiMinutes = (gate: string) => Math.round(6 + gateDist(gate) * 0.9);
export function carbonOps(flights: DemoFlight[]) {
  const rows = flights.filter(f => f.status !== "Cancelled" && f.status !== "Landed").map(f => {
    const taxi = taxiMinutes(f.gate);
    const taxiSavedKg = taxi * CARBON.taxiKgPerMin * CARBON.singleEngineSaving;
    const apuKg = CARBON.groundPowerMin * CARBON.apuKgPerMin;
    return { f, taxi, co2: Math.round((taxiSavedKg + apuKg) * CARBON.co2PerKg) };
  });
  const byAirline: Record<string, { name: string; flights: number; co2: number }> = {};
  rows.forEach(r => { const a = (byAirline[r.f.airCode] ??= { name: r.f.airline, flights: 0, co2: 0 }); a.flights++; a.co2 += r.co2; });
  return { rows, byAirline: Object.entries(byAirline).map(([code, v]) => ({ code, ...v })).sort((a, b) => b.co2 - a.co2), total: rows.reduce((s, r) => s + r.co2, 0) };
}

/* ───────── Turnaround ───────── */
export interface Task { id: string; name: string; mins: number; after?: string }
export const tasksFor = (wide: boolean): Task[] => wide
  ? [{ id: "deplane", name: "Deplaning", mins: 25 }, { id: "clean", name: "Cabin cleaning", mins: 35, after: "deplane" }, { id: "fuel", name: "Fuelling", mins: 40, after: "deplane" },
     { id: "cater", name: "Catering", mins: 30, after: "deplane" }, { id: "bag", name: "Baggage load", mins: 40, after: "deplane" }, { id: "board", name: "Boarding", mins: 35, after: "clean" }]
  : [{ id: "deplane", name: "Deplaning", mins: 12 }, { id: "clean", name: "Cabin cleaning", mins: 15, after: "deplane" }, { id: "fuel", name: "Fuelling", mins: 18, after: "deplane" },
     { id: "cater", name: "Catering", mins: 12, after: "deplane" }, { id: "bag", name: "Baggage load", mins: 20, after: "deplane" }, { id: "board", name: "Boarding", mins: 22, after: "clean" }];

/** Critical-path finish given per-task slip. Returns minutes after on-block when the aircraft is ready. */
export function readyAfter(tasks: Task[], slip: Record<string, number>): { ready: number; finish: Record<string, number> } {
  const finish: Record<string, number> = {};
  const fin = (t: Task): number => finish[t.id] ??= (t.after ? fin(tasks.find(x => x.id === t.after)!) : 0) + t.mins + (slip[t.id] ?? 0);
  tasks.forEach(fin);
  // boarding must also wait for fuel (safety) and bags
  const ready = Math.max(finish.board, finish.fuel + 5, finish.bag, finish.cater);
  return { ready, finish };
}
