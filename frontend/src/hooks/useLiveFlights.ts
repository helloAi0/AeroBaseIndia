import { useQuery } from "@tanstack/react-query";
import { fetchFlights } from "../api/client";
import { API_ENABLED } from "../config";
import { useAuthStore } from "../store/authStore";
import { useAirport } from "./useAirport";
import type { Flight } from "../types";

/** Row shape returned by GET /flights (src/controllers/FlightController.cc). */
interface FlightRow {
  id?: string;
  flight_number?: string;
  origin?: string;
  destination?: string;
  status?: string;
  gate?: string | null;
  departure_time?: string;
  arrival_time?: string;
}

const STATUSES: Flight["status"][] = ["Scheduled", "Boarding", "Departed", "Landed", "Delayed", "Cancelled"];

export function normaliseFlight(r: FlightRow, i: number): Flight {
  const status = STATUSES.find(s => s.toLowerCase() === String(r.status ?? "").toLowerCase()) ?? "Scheduled";
  return {
    id: String(r.id ?? `row-${i}`),
    flightNumber: String(r.flight_number ?? "—"),
    origin: r.origin || "—",
    destination: r.destination || "—",
    status,
    gate: r.gate || "—",
    departureTime: r.departure_time,
    arrivalTime: r.arrival_time,
  };
}

/** Shared React Query options, so the Dashboard poller and the Flights page share ONE request. */
export function useFlightsQuery() {
  const tenant = useAirport().code;
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  return useQuery({
    queryKey: ["flights", tenant],
    queryFn: fetchFlights,
    enabled: API_ENABLED && isLoggedIn,
    retry: false,
    refetchInterval: q => (q.state.status === "error" ? 60_000 : 10_000),
    refetchIntervalInBackground: false,
    select: (rows: unknown): Flight[] => (Array.isArray(rows) ? rows.map(normaliseFlight) : []),
  });
}

export type FlightsMode = "demo" | "live" | "offline";

/**
 * demo    – no API configured (built-in demo data)
 * live    – connected; `flights` are the server's rows (possibly empty)
 * offline – API configured but unreachable (callers fall back to demo data)
 */
export function useLiveFlights() {
  const q = useFlightsQuery();
  const mode: FlightsMode = !API_ENABLED ? "demo" : q.isSuccess ? "live" : q.isError ? "offline" : "demo";
  return { mode, flights: q.data ?? [], isFetching: q.isFetching, updatedAt: q.dataUpdatedAt };
}
