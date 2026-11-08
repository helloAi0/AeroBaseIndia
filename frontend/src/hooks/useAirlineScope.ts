import { useAuthStore } from "../store/authStore";
import { AIRLINES, airlineCodeFromStaffLevel, airlineOfFlight } from "../data/airlines";

export interface AirlineScope {
  /** Airline code for airline/pilot users, otherwise null (airport admin/staff see everything). */
  code: string | null;
  isAirline: boolean;
  name: string;
  color: string;
  /** Keep only rows belonging to the user's airline (no-op for airport users). */
  scope: <T>(rows: T[], flightOf: (row: T) => string) => T[];
}

export function useAirlineScope(): AirlineScope {
  const user = useAuthStore(s => s.user);
  const isAirportUser = user?.role === "airport_admin" || user?.role === "superadmin";
  const code = isAirportUser ? null : airlineCodeFromStaffLevel(user?.staffLevel);
  const info = code ? AIRLINES[code] : null;
  return {
    code,
    isAirline: code !== null,
    name: info?.name ?? "",
    color: info?.color ?? "#0ea5e9",
    scope: (rows, flightOf) => (code ? rows.filter(r => airlineOfFlight(flightOf(r)) === code) : rows),
  };
}
