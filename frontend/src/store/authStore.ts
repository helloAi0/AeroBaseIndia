import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "superadmin" | "airport_admin" | "staff" | "passenger" | "retailer";

interface User {
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

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      login: (user, token) => set({ user, token, isLoggedIn: true }),
      logout: () => set({ user: null, token: null, isLoggedIn: false }),
    }),
    { name: "aerobase-auth" }
  )
);
