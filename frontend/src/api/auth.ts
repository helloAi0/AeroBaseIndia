import axios from "axios";
import { api, ApiError } from "./client";
import type { User, UserRole } from "../store/authStore";

/**
 * invalid      – server reachable, credentials rejected
 * unavailable  – server unreachable / 5xx
 * unsupported  – server answered but did not issue a usable token (e.g. login not implemented)
 */
export class LoginError extends Error {
  kind: "invalid" | "unavailable" | "unsupported";
  constructor(kind: LoginError["kind"], message: string) {
    super(message);
    this.name = "LoginError";
    this.kind = kind;
  }
}

/** Decode (NOT verify) a JWT payload. The server verifies the signature on every request. */
export function decodeJwt(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

// Backend role names (migrations/016_seed_roles.sql) → dashboard role + staff level
const ROLE_MAP: Record<string, { role: UserRole; staffLevel?: string }> = {
  SUPER_ADMIN:      { role: "superadmin" },
  AIRPORT_ADMIN:    { role: "airport_admin" },
  GROUND_STAFF:     { role: "staff", staffLevel: "staff_ops" },
  SECURITY_OFFICER: { role: "staff", staffLevel: "staff_security" },
};

const titleCase = (s: string) => s.replace(/[._-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export interface BackendSession { user: User; token: string; expiresAt: number | null; }

export async function loginWithBackend(email: string, password: string): Promise<BackendSession> {
  let data: unknown;
  try {
    data = (await api.post("/login", { email, password })).data;
  } catch (e) {
    if (e instanceof ApiError) throw new LoginError("invalid", e.message);
    if (axios.isAxiosError(e)) {
      const s = e.response?.status;
      if (s === 400 || s === 401 || s === 403) throw new LoginError("invalid", "Incorrect email or password.");
      throw new LoginError("unavailable", "Can't reach the server. Check your connection and try again.");
    }
    throw e;
  }

  const token = (data as { token?: unknown } | null)?.token;
  if (typeof token !== "string" || token === "") {
    throw new LoginError("unsupported", "The server did not return a login token.");
  }
  const claims = decodeJwt(token);
  if (!claims) throw new LoginError("unsupported", "The server returned a malformed token.");

  const org = String(claims.org ?? "").replace(/[^A-Za-z0-9]/g, "");
  const backendRole = String(claims.role ?? "");
  const mapped = backendRole === "AIRLINE_OPS" && org ? { role: "staff" as UserRole, staffLevel: `airline_${org}` }
    : backendRole === "PILOT" && org ? { role: "staff" as UserRole, staffLevel: `pilot_captain_${org}` }
    : backendRole === "RETAILER" ? { role: "retailer" as UserRole }
    : ROLE_MAP[backendRole];
  if (!mapped) throw new LoginError("unsupported", `Role "${String(claims.role)}" has no dashboard yet.`);

  const airport = String(claims.airport ?? "DEL");
  const user: User = {
    id: String(claims.user_id ?? email),
    name: String(claims.name ?? titleCase(email.split("@")[0])),
    email,
    role: mapped.role,
    staffLevel: typeof claims.staff_level === "string" ? claims.staff_level : mapped.staffLevel,
    airport,
    airportName: String(claims.airport_name ?? airport),
    verified: true,
    lastLogin: new Date().toISOString(),
  };
  const expiresAt = typeof claims.exp === "number" ? claims.exp * 1000 : null;
  return { user, token, expiresAt };
}
