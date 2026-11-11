import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFlights } from "../api/client";
import { API_ENABLED } from "../config";
import { useAuthStore } from "../store/authStore";
import { useAirport } from "./useAirport";
import { ALL_AIRPORT_FLIGHTS, type DemoFlight } from "../data/airportFlights";

interface Row {
  id?: string; flight_number?: string; origin?: string; destination?: string; status?: string; gate?: string | null;
  departure_time?: string; arrival_time?: string; airline?: string; airline_code?: string; aircraft?: string;
  terminal?: string; passengers?: number; issue?: string; delay_minutes?: number;
}
const STATUS = ["Scheduled", "Boarding", "Departed", "Landed", "Delayed", "Cancelled"];
const hhmm = (iso?: string) => (iso && iso.length >= 16 ? iso.slice(11, 16) : "00:00");

/** Map a backend flight row onto the board shape every ops tool uses. */
export function rowToBoard(r: Row, i: number): DemoFlight & { backendId?: string; delay?: number } {
  const status = STATUS.find(s => s.toLowerCase() === String(r.status ?? "").toLowerCase()) ?? "Scheduled";
  const num = String(r.flight_number ?? "");
  return {
    id: i + 1, backendId: r.id, flight: num, airline: r.airline || num.split("-")[0], airCode: r.airline_code || num.split("-")[0],
    from: r.origin || "—", to: r.destination || "—", dep: hhmm(r.departure_time), arr: hhmm(r.arrival_time),
    gate: r.gate || "—", terminal: r.terminal || "—", status: status as DemoFlight["status"], pax: r.passengers ?? 0,
    aircraft: r.aircraft || "TBD", issue: r.issue || undefined, delay: r.delay_minutes ?? 0,
    captain: "", fuel: "",
  } as unknown as DemoFlight & { backendId?: string; delay?: number };
}

/**
 * The flight board for ops tools: the server's real rows when connected, otherwise the built-in demo board.
 * `live` tells the page which one it is showing.
 */
export function useBoard(): { flights: DemoFlight[]; live: boolean; loading: boolean; error: boolean; refetch: () => void } {
  const tenant = useAirport().code;
  const loggedIn = useAuthStore(s => s.isLoggedIn);
  const source = useAuthStore(s => s.source);
  const enabled = API_ENABLED && loggedIn && source === "backend";
  const q = useQuery({ queryKey: ["flights", tenant], queryFn: fetchFlights, enabled, retry: false, refetchInterval: 15_000, refetchIntervalInBackground: false });
  const flights = useMemo(() => (Array.isArray(q.data) ? (q.data as Row[]).map(rowToBoard) : []), [q.data]);
  if (!enabled) return { flights: ALL_AIRPORT_FLIGHTS, live: false, loading: false, error: false, refetch: () => {} };
  return { flights, live: q.isSuccess, loading: q.isLoading, error: q.isError, refetch: () => void q.refetch() };
}
