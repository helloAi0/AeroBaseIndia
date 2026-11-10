import { create } from "zustand";
import type { Flight, HealthStatus, Tenant } from "../types";

interface AppState {
  tenant:       Tenant;
  flights:      Flight[];
  health:       HealthStatus | null;
  sidebarOpen:  boolean;
  activePage:   string;
  /** Airport currently being viewed (superadmin can switch; others are locked to their own). */
  activeAirport: string | null;

  setTenant:     (t: Tenant) => void;
  setFlights:    (f: Flight[]) => void;
  setHealth:     (h: HealthStatus) => void;
  setSidebar:    (v: boolean) => void;
  setActivePage: (p: string) => void;
  setActiveAirport: (code: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  tenant:      { id: "DEL", name: "Delhi International Airport", code: "DEL" },
  flights:     [],
  health:      null,
  sidebarOpen: typeof window === "undefined" ? true : window.innerWidth >= 1024,
  activePage:  "dashboard",
  activeAirport: null,

  setTenant:     (tenant)     => set({ tenant }),
  setFlights:    (flights)    => set({ flights }),
  setHealth:     (health)     => set({ health }),
  setSidebar:    (sidebarOpen)=> set({ sidebarOpen }),
  setActivePage: (activePage) => set({ activePage }),
  setActiveAirport: (activeAirport) => set({ activeAirport }),
}));