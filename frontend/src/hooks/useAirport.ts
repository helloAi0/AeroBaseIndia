import { useEffect, useState } from "react";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";
import { API_ENABLED } from "../config";
import { fetchAirports, switchAirport, type AirportInfo } from "../api/account";
import { decodeJwt } from "../api/auth";

export const AIRPORT_LIST: AirportInfo[] = [
  { code: "DEL", name: "Delhi IGI" }, { code: "BOM", name: "Mumbai CSMIA" }, { code: "BLR", name: "Bengaluru KIA" },
  { code: "HYD", name: "Hyderabad RGIA" }, { code: "CCU", name: "Kolkata NSCBI" }, { code: "MAA", name: "Chennai" },
  { code: "COK", name: "Kochi" }, { code: "SXR", name: "Srinagar" },
];

let cache: AirportInfo[] | null = null;
/** Airports from the server (cached for the session); falls back to a built-in short list. */
export function useAirportList(): AirportInfo[] {
  const [list, setList] = useState<AirportInfo[]>(cache ?? AIRPORT_LIST);
  useEffect(() => { if (!API_ENABLED || cache) return; fetchAirports().then(a => { if (a.length) { cache = a; setList(a); } }).catch(() => undefined); }, []);
  return list;
}

/** The airport the whole app is showing. Only the platform owner (superadmin) may switch it: the server issues a new token for the chosen airport. */
export function useAirport() {
  const user = useAuthStore(s => s.user);
  const active = useAppStore(s => s.activeAirport);
  const canSwitch = user?.role === "superadmin";
  const code = (canSwitch && active) || user?.airport || "DEL";
  const setAirport = async (next: string) => {
    const st = useAuthStore.getState();
    if (!canSwitch || next === code) return;
    if (st.source === "backend") {
      const r = await switchAirport(next);                       // throws with a readable message on failure
      const claims = decodeJwt(r.token); const exp = typeof claims?.exp === "number" ? claims.exp * 1000 : st.expiresAt;
      if (st.user) st.login({ ...st.user, airport: r.airport, airportName: r.airport_name }, r.token, { source: "backend", expiresAt: exp });
    }
    useAppStore.getState().setActiveAirport(next);
  };
  return { code, name: (cache ?? AIRPORT_LIST).find(a => a.code === code)?.name ?? user?.airportName ?? code, canSwitch, setAirport };
}
