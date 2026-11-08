import { create } from "zustand";
import type { Flight, HealthStatus, Tenant } from "../types";

interface AppState {
  tenant:       Tenant;
  flights:      Flight[];
  health:       HealthStatus | null;
  sidebarOpen:  boolean;
  activePage:   string;

  setTenant:     (t: Tenant) => void;
  setFlights:    (f: Flight[]) => void;
  setHealth:     (h: HealthStatus) => void;
  setSidebar:    (v: boolean) => void;
  setActivePage: (p: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  tenant:      { id: "DEL", name: "Delhi International Airport", code: "DEL" },
  flights:     [],
  health:      null,
  sidebarOpen: true,
  activePage:  "dashboard",

  setTenant:     (tenant)     => set({ tenant }),
  setFlights:    (flights)    => set({ flights }),
  setHealth:     (health)     => set({ health }),
  setSidebar:    (sidebarOpen)=> set({ sidebarOpen }),
  setActivePage: (activePage) => set({ activePage }),
}));