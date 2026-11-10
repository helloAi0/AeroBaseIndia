import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "superadmin" | "airport_admin" | "staff" | "passenger" | "retailer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  airport: string;
  airportName: string;
  lastLogin?: string;
  verified?: boolean;
  staffLevel?: string;
}

/** "backend" = signed in against the API with a server-issued JWT; "demo" = built-in demo account. */
export type SessionSource = "backend" | "demo";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  source: SessionSource;
  /** Epoch ms when the JWT expires (backend sessions only). */
  expiresAt: number | null;
  login: (user: User, token: string, meta?: { source?: SessionSource; expiresAt?: number | null }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      source: "demo",
      expiresAt: null,
      login: (user, token, meta) =>
        set({ user, token, isLoggedIn: true, source: meta?.source ?? "demo", expiresAt: meta?.expiresAt ?? null }),
      logout: () => set({ user: null, token: null, isLoggedIn: false, source: "demo", expiresAt: null }),
    }),
    {
      name: "aerobase-auth",
      version: 1,
      // Sessions saved before `source`/`expiresAt` existed were demo logins.
      migrate: (state) => ({ source: "demo", expiresAt: null, ...(state as object) }) as AuthState,
    }
  )
);
