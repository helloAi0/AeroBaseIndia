/** Single source of truth for airline identity + scoping. */
export interface AirlineInfo { name: string; color: string; }

export const AIRLINES: Record<string, AirlineInfo> = {
  AI:   { name: "Air India",         color: "#ef4444" },
  "6E": { name: "IndiGo",            color: "#0ea5e9" },
  UK:   { name: "Vistara",           color: "#8b5cf6" },
  EK:   { name: "Emirates",          color: "#f59e0b" },
  SG:   { name: "SpiceJet",          color: "#f97316" },
  QP:   { name: "Akasa Air",         color: "#22c55e" },
  IX:   { name: "Air India Express", color: "#dc2626" },
};

/** "airline_6E" | "pilot_captain_AI" | "pilot_fo_6E" → "6E" | "AI" | null */
export function airlineCodeFromStaffLevel(staffLevel?: string): string | null {
  const m = /^(?:airline|pilot_captain|pilot_fo)_(\w+)$/.exec(staffLevel ?? "");
  return m && AIRLINES[m[1]] ? m[1] : null;
}

/** "6E-2341" → "6E" */
export function airlineOfFlight(flight: string): string {
  return flight.split("-")[0];
}
