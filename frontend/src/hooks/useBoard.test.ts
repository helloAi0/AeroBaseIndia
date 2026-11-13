import { describe, expect, it } from "vitest";
import { rowToBoard } from "./useBoard";

describe("rowToBoard", () => {
  it("maps a backend row to the board shape", () => {
    const f = rowToBoard({ id: "uuid-1", flight_number: "AI-101", origin: "DEL", destination: "BOM", status: "BOARDING", gate: "A1",
      departure_time: "2026-11-12T10:30:00", arrival_time: "2026-11-12T12:40:00", airline: "Air India", airline_code: "AI", aircraft: "B787-8", terminal: "T3", passengers: 243, delay_minutes: 15, issue: "Fog" }, 4) as any;
    expect(f).toMatchObject({ id: 5, backendId: "uuid-1", flight: "AI-101", from: "DEL", to: "BOM", dep: "10:30", arr: "12:40", date: "2026-11-12", gate: "A1",
      terminal: "T3", status: "Boarding", pax: 243, aircraft: "B787-8", delay: 15, issue: "Fog", airCode: "AI", airline: "Air India" });
  });
  it("fills safe defaults for sparse rows and unknown status", () => {
    const f = rowToBoard({ flight_number: "6E-22", status: "weird" }, 0) as any;
    expect(f).toMatchObject({ airline: "6E", airCode: "6E", from: "—", gate: "—", dep: "00:00", status: "Scheduled", pax: 0, aircraft: "TBD", date: "", delay: 0 });
    expect(f.issue).toBeUndefined();
  });
});
