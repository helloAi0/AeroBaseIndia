/**
 * Natural-language flight search — a deterministic, offline parser (no AI service, no cost).
 * "delayed indigo flights to mumbai", "cancelled AI from delhi", "gate B3", "6E 202 boarding"
 */
export interface SearchableFlight {
  flight: string; airline: string; airCode: string; from: string; to: string;
  gate: string; status: string; terminal?: string; captain?: string;
}

const STATUS_WORDS: Record<string, string> = {
  delayed: "Delayed", delay: "Delayed", late: "Delayed",
  cancelled: "Cancelled", canceled: "Cancelled", cancel: "Cancelled",
  boarding: "Boarding", departed: "Departed", airborne: "Departed", flying: "Departed",
  landed: "Landed", arrived: "Landed", scheduled: "Scheduled", upcoming: "Scheduled",
};
const AIRLINE_WORDS: Record<string, string> = {
  "air india express": "IX", "air india": "AI", indigo: "6E", emirates: "EK",
  spicejet: "SG", akasa: "QP", "akasa air": "QP",
};
const CITY_CODES: Record<string, string[]> = {
  delhi: ["DEL", "delhi"], mumbai: ["BOM", "mumbai"], bombay: ["BOM", "mumbai"], bangalore: ["BLR", "bengaluru", "bangalore"],
  bengaluru: ["BLR", "bengaluru", "bangalore"], chennai: ["MAA", "chennai"], kolkata: ["CCU", "kolkata"],
  hyderabad: ["HYD", "hyderabad"], goa: ["GOI", "goa"], pune: ["PNQ", "pune"], dubai: ["DXB", "dubai"],
  ahmedabad: ["AMD", "ahmedabad"], jaipur: ["JAI", "jaipur"], lucknow: ["LKO", "lucknow"],
};
const STOP = new Set(["flight", "flights", "show", "me", "find", "all", "the", "a", "of", "at", "for", "with", "which", "are", "is", "that", "any", "list", "airlines", "airline", "status", "from", "to", "gate", "on", "time"]);

export interface ParsedQuery {
  statuses: string[]; airlines: string[]; to: string[][]; from: string[][]; gates: string[]; terms: string[];
}

export function parseQuery(q: string): ParsedQuery {
  let s = " " + q.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ") + " ";
  const out: ParsedQuery = { statuses: [], airlines: [], to: [], from: [], gates: [], terms: [] };

  for (const k of Object.keys(AIRLINE_WORDS).sort((a, b) => b.length - a.length)) {
    if (s.includes(` ${k} `)) { out.airlines.push(AIRLINE_WORDS[k]); s = s.replace(` ${k} `, " "); }
  }
  s = s.replace(/ on time /, " scheduled ");
  s = s.replace(/ gate ([a-z]?\d+[a-z]?) /g, (_, g) => { out.gates.push(g.toUpperCase()); return " "; });
  s = s.replace(/ (to|towards|going to|bound for) ([a-z]+) /g, (_, __, c) => { out.to.push(CITY_CODES[c] ?? [c]); return " "; });
  s = s.replace(/ (from|leaving|out of) ([a-z]+) /g, (_, __, c) => { out.from.push(CITY_CODES[c] ?? [c]); return " "; });

  // flight numbers like "6e 202", "ai-101", "ai101"
  const fn = s.match(/ ([a-z0-9]{2})[ -]?(\d{2,4}) /);
  if (fn && /[a-z]/.test(fn[1])) { out.terms.push(`${fn[1]}-${fn[2]}`); s = s.replace(fn[0], " "); }

  for (const w of s.split(" ").filter(Boolean)) {
    if (STATUS_WORDS[w]) out.statuses.push(STATUS_WORDS[w]);
    else if (!STOP.has(w)) {
      const code = Object.entries(AIRLINE_WORDS).find(([, c]) => c.toLowerCase() === w)?.[1];
      if (code) out.airlines.push(code); else out.terms.push(w);
    }
  }
  return out;
}

const norm = (x: string) => x.toLowerCase().replace(/[\s-]/g, "");

export function matchFlight(f: SearchableFlight, p: ParsedQuery): boolean {
  if (p.statuses.length && !p.statuses.includes(f.status)) return false;
  if (p.airlines.length && !p.airlines.includes(f.airCode)) return false;
  if (p.gates.length && !p.gates.includes(f.gate.toUpperCase())) return false;
  const hit = (alts: string[], field: string) => alts.some(a => field.toLowerCase().includes(a.toLowerCase()));
  if (!p.to.every(a => hit(a, f.to))) return false;
  if (!p.from.every(a => hit(a, f.from))) return false;
  const hay = norm([f.flight, f.airline, f.from, f.to, f.gate, f.terminal ?? "", f.captain ?? ""].join(" "));
  return p.terms.every(t => hay.includes(norm(t)));
}

/** Human-readable echo of how the query was understood, shown under the search box. */
export function describeQuery(p: ParsedQuery): string {
  const bits: string[] = [];
  if (p.statuses.length) bits.push(`status ${p.statuses.join("/")}`);
  if (p.airlines.length) bits.push(`airline ${p.airlines.join("/")}`);
  p.to.forEach(a => bits.push(`to ${a[0]}`)); p.from.forEach(a => bits.push(`from ${a[0]}`));
  if (p.gates.length) bits.push(`gate ${p.gates.join("/")}`);
  if (p.terms.length) bits.push(`text “${p.terms.join(" ")}”`);
  return bits.join(" · ");
}
