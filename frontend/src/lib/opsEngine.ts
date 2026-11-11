/**
 * Pure, deterministic ops models used by Autopilot, Copilot and the What-if simulator.
 * These are transparent planning heuristics (every assumption is exported and shown in the UI),
 * not trained ML. Plug the ML service's delay prediction in where `delayMinutes` is derived.
 */
import type { DemoFlight } from "../data/airportFlights";

export const ASSUME = {
  connectingShare: 0.18,      // share of passengers on a flight assumed to be connecting
  minConnectMin: 45,          // minimum connection time
  runwayPerHour: 36,          // runway movements per hour (DEL-class single-runway-pair planning figure)
  defaultDelayMin: 30,
};
const CAPACITY: Record<string, number> = { "B787-8": 256, "A320neo": 186, A320: 180, B737: 189, A321neo: 222, A321: 220, B737MAX: 189, "B777-200": 340, A380: 520, TBD: 180 };
export const capacityOf = (f: DemoFlight) => CAPACITY[f.aircraft] ?? 180;

export const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
export const fmt = (min: number) => { const m = ((Math.round(min) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };

export function delayMinutes(f: DemoFlight): number {
  const m = /(\d+)\s*min/i.exec(f.issue ?? "");
  if (m) return +m[1];
  return f.status === "Delayed" ? ASSUME.defaultDelayMin : 0;
}
export const isDisrupted = (f: DemoFlight) => f.status === "Cancelled" || f.status === "Delayed" || !!f.issue;

export interface Alternative { flight: DemoFlight; seats: number; waitMin: number }
export interface Disruption {
  flight: DemoFlight; delay: number; cancelled: boolean; connectingPax: number; atRisk: number;
  alternatives: Alternative[]; reason: string;
}

/** Disrupted flights, the passengers whose connections are at risk, and later same-route flights with spare seats. */
export function buildDisruptions(flights: DemoFlight[]): Disruption[] {
  return flights.filter(f => isDisrupted(f) && f.status !== "Departed" && f.status !== "Landed").map(f => {
    const cancelled = f.status === "Cancelled";
    const delay = cancelled ? 0 : delayMinutes(f) || ASSUME.defaultDelayMin;
    const connectingPax = Math.round(f.pax * ASSUME.connectingShare);
    // a delay only breaks connections when it eats the connection buffer
    const atRisk = cancelled ? f.pax : delay > 20 ? Math.min(f.pax, Math.round(connectingPax * Math.min(1, delay / 90) + (delay > 60 ? f.pax * 0.05 : 0))) : 0;
    const dep = toMin(f.dep);
    const alternatives = flights
      .filter(o => o.id !== f.id && o.from === f.from && o.to === f.to && o.status === "Scheduled" && toMin(o.dep) >= dep + (cancelled ? 0 : delay))
      .map(o => ({ flight: o, seats: Math.max(0, capacityOf(o) - o.pax), waitMin: toMin(o.dep) - dep }))
      .filter(a => a.seats > 0).sort((a, b) => a.waitMin - b.waitMin).slice(0, 3);
    return { flight: f, delay, cancelled, connectingPax, atRisk, alternatives, reason: f.issue ?? (cancelled ? "Cancelled" : "Delayed") };
  }).sort((a, b) => b.atRisk - a.atRisk);
}

/* ───────────── What-if simulator: single runway queue ───────────── */
export interface Scenario { closeStart: number; closeMin: number; capacityPct: number; extraDelay: number }
export interface SimRow { flight: DemoFlight; planned: number; actual: number; delay: number }

export function simulate(flights: DemoFlight[], sc: Scenario): SimRow[] {
  const deps = flights.filter(f => f.from === "DEL" && (f.status === "Scheduled" || f.status === "Boarding" || f.status === "Delayed"))
    .sort((a, b) => toMin(a.dep) - toMin(b.dep));
  const slot = 60 / Math.max(1, ASSUME.runwayPerHour * (sc.capacityPct / 100));
  const closeEnd = sc.closeStart + sc.closeMin;
  let free = 0;
  return deps.map(f => {
    const planned = toMin(f.dep) + delayMinutes(f);
    let t = Math.max(planned + sc.extraDelay, free);
    if (sc.closeMin > 0 && t >= sc.closeStart && t < closeEnd) t = closeEnd;   // held until the runway reopens
    free = t + slot;
    return { flight: f, planned: toMin(f.dep), actual: t, delay: Math.max(0, Math.round(t - toMin(f.dep))) };
  });
}
export const summarise = (rows: SimRow[]) => {
  const delays = rows.map(r => r.delay);
  const total = delays.reduce((a, b) => a + b, 0);
  return { total, avg: rows.length ? Math.round(total / rows.length) : 0, worst: rows.reduce((w, r) => (r.delay > (w?.delay ?? -1) ? r : w), undefined as SimRow | undefined),
    affected: delays.filter(d => d > 15).length, pax: rows.filter(r => r.delay > 15).reduce((a, r) => a + r.flight.pax, 0) };
};

/* ───────────── Copilot: rule-based intents over the flight board ───────────── */
export interface CopilotAnswer { text: string; actions?: { label: string; page: string }[] }

export function answer(q: string, flights: DemoFlight[], nowMin: number): CopilotAnswer {
  const s = q.toLowerCase();
  const code = /\b([a-z0-9]{2})[\s-]?(\d{2,4})\b/i.exec(q);
  const byNum = code ? flights.find(f => f.flight.replace("-", "").toLowerCase() === (code[1] + code[2]).toLowerCase()) : undefined;

  if (byNum && /(why|late|delay|reason)/.test(s)) {
    const d = delayMinutes(byNum);
    return { text: byNum.issue ? `${byNum.flight} (${byNum.from}→${byNum.to}): ${byNum.issue}.${d ? ` Expected delay about ${d} min.` : ""}` : `${byNum.flight} is ${byNum.status.toLowerCase()} with no recorded issue.`,
      actions: [{ label: "Open Autopilot", page: "autopilot" }, { label: "Announce", page: "announcements" }] };
  }
  if (byNum) return { text: `${byNum.flight} ${byNum.airline} ${byNum.from}→${byNum.to}, departs ${byNum.dep} from gate ${byNum.gate} (${byNum.terminal}). Status: ${byNum.status}. Passengers: ${byNum.pax}.`, actions: [{ label: "Open Flights", page: "flights" }] };

  if (/gate/.test(s) && /(free|available|open|empty)/.test(s)) {
    const win = /(\d+)\s*min/.exec(s)?.[1] ? +(/(\d+)\s*min/.exec(s)![1]) : 30;
    const busy = new Set(flights.filter(f => (f.status === "Boarding" || f.status === "Delayed") || (toMin(f.dep) >= nowMin && toMin(f.dep) <= nowMin + win)).map(f => f.gate));
    const all = Array.from(new Set(flights.map(f => f.gate))).sort();
    const free = all.filter(g => !busy.has(g));
    return { text: free.length ? `Gates with no boarding or departure in the next ${win} min: ${free.join(", ")}.` : `Every gate has activity in the next ${win} min.`, actions: [{ label: "Open Gates", page: "gates" }] };
  }
  if (/(how many|count|number).*(delay)|delayed flights|what.*delayed/.test(s)) {
    const d = flights.filter(f => f.status === "Delayed" || delayMinutes(f) > 0);
    return { text: d.length ? `${d.length} flight(s) disrupted: ${d.map(f => `${f.flight} (${f.issue ?? "delayed"})`).join("; ")}.` : "No delayed flights right now.", actions: [{ label: "Open Autopilot", page: "autopilot" }] };
  }
  const to = /\b(?:to|for)\s+([a-z]{3,})/.exec(s)?.[1];
  if (to) {
    const hits = flights.filter(f => f.to.toLowerCase() === to || f.from.toLowerCase() === to);
    if (hits.length) return { text: `${hits.length} flight(s) with ${to.toUpperCase()}: ${hits.map(f => `${f.flight} ${f.dep} ${f.status}`).join(", ")}.` };
  }
  if (/(busiest|most).*(gate|terminal)/.test(s)) {
    const c: Record<string, number> = {}; flights.forEach(f => { c[f.terminal] = (c[f.terminal] ?? 0) + f.pax; });
    const [t, n] = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return { text: `${t} is busiest today with ${n} passengers across its flights.` };
  }
  if (/(what.?if|simulat|runway)/.test(s)) return { text: "Use the What-if Simulator to close a runway or cut capacity and see the knock-on delays.", actions: [{ label: "Open What-if", page: "whatif" }] };
  if (/(weather|rain|fog|storm)/.test(s)) return { text: "Check live conditions on the Weather page.", actions: [{ label: "Open Weather", page: "weather" }] };
  return { text: "I can answer things like “why is UK-925 late?”, “which gates are free in 30 min?”, “how many flights are delayed?”, “flights to Mumbai”, or “which terminal is busiest?”." };
}
