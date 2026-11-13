import type { DemoFlight } from "../data/airportFlights";
let n = 0;
/** Minimal flight for engine tests. */
export const mk = (o: Partial<Record<string, unknown>> = {}): DemoFlight => ({
  id: ++n, flight: `XX-${100 + n}`, airline: "Test Air", airCode: "XX", from: "DEL", to: "BOM", dep: "10:00", arr: "12:00",
  gate: "B3", terminal: "T2", status: "Scheduled", pax: 150, aircraft: "A320", captain: "", fuel: "", ...o,
}) as unknown as DemoFlight;
