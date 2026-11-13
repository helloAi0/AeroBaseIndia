import type { DemoFlight } from "../data/airportFlights";
import { capacityOf, delayMinutes } from "./opsEngine";
import type { CopilotAnswer } from "./opsEngine";

/**
 * Business questions for the Ops Copilot: passengers, flights, load, punctuality and revenue by airline.
 * Who may ask is decided HERE, from the signed-in role, so a passenger asking "how many tickets were sold today?" gets a polite refusal.
 *   management (airport director / platform owner) → everything for the airport
 *   airline staff & pilots                         → their own airline only, no revenue
 *   everyone else                                  → no aggregates
 */
export interface Viewer { role: string; staffLevel?: string }
export interface Revenue { paid: number; paidCount: number; pending: number; pendingCount: number; currency: string }
export interface InsightCtx { viewer: Viewer; airport: string; revenue?: Revenue | null }

export type Scope = { kind: "all" } | { kind: "airline"; code: string } | { kind: "none" };

export function scopeOf(v: Viewer): Scope {
  if (v.role === "airport_admin" || v.role === "superadmin") return { kind: "all" };
  const m = /^(?:airline|pilot_\w+?)_([A-Z0-9]{2})$/.exec(v.staffLevel ?? "") ?? /_([A-Z0-9]{2})$/.exec(v.staffLevel ?? "");
  if (v.role === "staff" && m && /^(airline|pilot)/.test(v.staffLevel ?? "")) return { kind: "airline", code: m[1] };
  return { kind: "none" };
}

const BUSINESS = /(passenger|pax|booked|booking|ticket|seat|load factor|revenue|spend|spent|spending|earn|income|sales|sold|market share|on-?time|punctual|busiest airline|top airline|biggest airline|how many flights|total flights|flights today|per airline|by airline)/i;
const MONEY = /(revenue|spend|spent|spending|earn|income|sales|sold|money|paid|payment)/i;
const money = (n: number, cur: string) => (cur === "INR" ? "₹" : cur + " ") + Math.round(n).toLocaleString("en-IN");
const n0 = (n: number) => Math.round(n).toLocaleString("en-IN");

interface Stat { code: string; name: string; flights: number; pax: number; seats: number; delayed: number; cancelled: number }
export function airlineStats(flights: DemoFlight[]): Stat[] {
  const m = new Map<string, Stat>();
  for (const f of flights) {
    const s = m.get(f.airCode) ?? { code: f.airCode, name: f.airline || f.airCode, flights: 0, pax: 0, seats: 0, delayed: 0, cancelled: 0 };
    s.flights++; s.pax += f.pax; s.seats += capacityOf(f);
    if (f.status === "Cancelled") s.cancelled++; else if (f.status === "Delayed" || delayMinutes(f) > 0) s.delayed++;
    m.set(f.airCode, s);
  }
  return [...m.values()].sort((a, b) => b.pax - a.pax);
}

function findAirline(q: string, stats: Stat[]): Stat | undefined {
  const s = " " + q.toLowerCase().replace(/[^a-z0-9 ]/g, " ") + " ";
  return stats.find(a => s.includes(` ${a.name.toLowerCase().replace(/[^a-z0-9 ]/g, " ")} `))
    ?? stats.find(a => new RegExp(`\\b${a.code.toLowerCase()}\\b`).test(s) && a.code.length === 2 && !/^(to|in|at|is|of|on|by|do|or)$/.test(a.code.toLowerCase()))
    ?? stats.find(a => s.includes(` ${a.name.toLowerCase().split(" ")[0]} `) && a.name.length > 3);
}

const REFUSE: CopilotAnswer = { text: "Bookings, passenger totals and revenue are shared with airport management and the airline concerned only, so I can't answer that here. I can help with your own flight, gates, delays and wayfinding." };

/** Returns null when the question is not a business question (the caller falls back to the flight-board answers). */
export function businessAnswer(q: string, flights: DemoFlight[], ctx: InsightCtx): CopilotAnswer | null {
  if (!BUSINESS.test(q)) return null;
  const scope = scopeOf(ctx.viewer);
  if (scope.kind === "none") return REFUSE;
  const stats = airlineStats(flights);
  const asked = findAirline(q, stats);
  const money_q = MONEY.test(q);

  if (scope.kind === "airline") {
    if (money_q) return { text: "Revenue is visible to airport management. I can tell you your airline's flights, passengers and punctuality today." };
    if (asked && asked.code !== scope.code) return { text: "I can only share figures for your own airline." };
    const mine = stats.find(s => s.code === scope.code);
    return mine ? { text: describe(mine, ctx.airport), actions: [{ label: "Open your flights", page: "flights" }] } : { text: `No ${scope.code} flights on today's ${ctx.airport} board.` };
  }

  // management
  if (money_q) {
    const r = ctx.revenue;
    if (r === undefined) return { text: "Checking payment records… ask again in a moment." };
    if (!r || (r.paidCount === 0 && r.pendingCount === 0)) return { text: `No payments have been recorded for ${ctx.airport} yet. Revenue appears here as soon as orders are paid through Razorpay or Stripe (Payments page).`, actions: [{ label: "Open Payments", page: "payments" }] };
    return { text: `Recorded payments for ${ctx.airport}: ${money(r.paid, r.currency)} received across ${r.paidCount} paid order(s)${r.pendingCount ? `, plus ${money(r.pending, r.currency)} still pending (${r.pendingCount})` : ""}. Ticket sale prices are not stored here, so this is airport billing, not airline fares.`, actions: [{ label: "Open Payments", page: "payments" }, { label: "Open Revenue", page: "revenue" }] };
  }
  if (asked) return { text: describe(asked, ctx.airport), actions: [{ label: "Open Flights", page: "flights" }] };
  if (/(busiest|top|biggest|most|rank|market share|per airline|by airline|each airline|airlines)/i.test(q) && stats.length) {
    const tot = stats.reduce((a, s) => a + s.pax, 0) || 1;
    return { text: `Passengers by airline today at ${ctx.airport} (estimated from aircraft seats at typical load):\n` + stats.slice(0, 6).map((s, i) => `${i + 1}. ${s.name}: ${n0(s.pax)} passengers on ${s.flights} flights (${Math.round((s.pax / tot) * 100)}%)`).join("\n"), actions: [{ label: "Open Analytics", page: "analytics" }] };
  }
  const pax = stats.reduce((a, s) => a + s.pax, 0), n = flights.length;
  const delayed = stats.reduce((a, s) => a + s.delayed, 0), canc = stats.reduce((a, s) => a + s.cancelled, 0);
  const top = stats[0];
  return { text: `Today at ${ctx.airport}: ${n} flights across ${stats.length} airlines carrying about ${n0(pax)} passengers (estimated). ${delayed} delayed, ${canc} cancelled.${top ? ` Largest airline: ${top.name} with ${n0(top.pax)} passengers on ${top.flights} flights.` : ""}`, actions: [{ label: "Open Analytics", page: "analytics" }] };
}

function describe(s: Stat, airport: string): string {
  const onTime = s.flights ? Math.round(((s.flights - s.delayed - s.cancelled) / s.flights) * 100) : 100;
  const load = s.seats ? Math.round((s.pax / s.seats) * 100) : 0;
  return `${s.name} at ${airport} today: ${s.flights} flights, about ${n0(s.pax)} passengers booked (estimated, ${load}% of ${n0(s.seats)} seats). ${s.delayed} delayed, ${s.cancelled} cancelled — ${onTime}% on time.`;
}
