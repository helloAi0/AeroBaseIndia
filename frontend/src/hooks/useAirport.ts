import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";

export const AIRPORT_LIST = [
  { code: "DEL", name: "Delhi IGI" },
  { code: "BOM", name: "Mumbai CSMIA" },
  { code: "BLR", name: "Bengaluru KIA" },
] as const;

/** The airport the whole app is showing. Only superadmins may switch it (the backend enforces the same rule). */
export function useAirport() {
  const user = useAuthStore(s => s.user);
  const active = useAppStore(s => s.activeAirport);
  const set = useAppStore(s => s.setActiveAirport);
  const canSwitch = user?.role === "superadmin";
  const code = (canSwitch && active) || user?.airport || "DEL";
  return { code, name: AIRPORT_LIST.find(a => a.code === code)?.name ?? code, canSwitch, setAirport: set };
}
