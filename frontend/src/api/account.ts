import axios from "axios";
import { api } from "./client";

export interface AirportInfo { code: string; name: string; }

function msg(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { error?: string } | undefined;
    if (d?.error) return d.error;
    if (!e.response) return "Can't reach the server. Check your connection and try again.";
  }
  return e instanceof Error && e.message ? e.message : fallback;
}

export async function fetchAirports(): Promise<AirportInfo[]> {
  const r = await api.get("/api/public/airports");
  return (r.data?.airports ?? []) as AirportInfo[];
}

export interface SignupInput { name: string; email: string; password: string; airport: string; account_type: "PASSENGER" | "RETAILER" | "PILOT"; shop?: string; crew_ref?: string; license?: string; }
export async function signup(input: SignupInput): Promise<string> {
  try { return String((await api.post("/api/auth/register", input)).data?.message ?? "Account created."); }
  catch (e) { throw new Error(msg(e, "Could not create the account")); }
}

/** Returns the server message and, in local/dev setups without an email provider, the reset link itself. */
export async function forgotPassword(email: string): Promise<{ message: string; resetLink?: string }> {
  try { const d = (await api.post("/api/auth/forgot", { email })).data; return { message: String(d?.message ?? "Check your email."), resetLink: d?.reset_link }; }
  catch (e) { throw new Error(msg(e, "Could not start the reset")); }
}

export async function resetPassword(token: string, password: string): Promise<string> {
  try { return String((await api.post("/api/auth/reset", { token, password })).data?.message ?? "Password updated."); }
  catch (e) { throw new Error(msg(e, "Could not reset the password")); }
}

export async function switchAirport(airport: string): Promise<{ token: string; airport: string; airport_name: string }> {
  try { return (await api.post("/api/auth/switch-airport", { airport })).data; }
  catch (e) { throw new Error(msg(e, "Could not switch airport")); }
}

export interface TeamMember { id: string; name: string; email: string; role: string; org: string; created_at: string; }
export const listTeam = async (): Promise<TeamMember[]> => (await api.get("/api/team")).data?.team ?? [];
export async function addTeamMember(m: { name: string; email: string; password: string; role: string; org?: string }): Promise<void> {
  try { await api.post("/api/team", m); } catch (e) { throw new Error(msg(e, "Could not add the person")); }
}
export async function removeTeamMember(id: string): Promise<void> {
  try { await api.delete(`/api/team/${id}`); } catch (e) { throw new Error(msg(e, "Could not remove the person")); }
}

export const passwordProblem = (p: string): string =>
  p.length < 10 ? "Use at least 10 characters" : !/[A-Za-z]/.test(p) || !/\d/.test(p) ? "Include a letter and a number" : "";

export interface Officer { id: string; name: string; email: string; ref: string; head: boolean }
export async function securityTeam(): Promise<Officer[]> {
  try { return ((await api.get("/api/team/security")).data?.officers ?? []) as Officer[]; }
  catch (e) { throw new Error(msg(e, "Could not load the security team")); }
}

/** A pilot who changed airline (or airport) links the reference ID the new airline issued; returns a fresh session token for the new assignment. */
export async function linkCrewRef(crew_ref: string, license: string): Promise<{ token: string; airport: string; airport_name: string }> {
  try { return (await api.post("/api/crew/link", { crew_ref, license })).data; }
  catch (e) { throw new Error(msg(e, "Could not link the reference ID")); }
}

export interface AirlineInfo { code: string; name: string }
export async function fetchAirlines(airport: string): Promise<AirlineInfo[]> {
  const r = await api.get("/api/public/airlines", { params: { airport } });
  return (r.data?.airlines ?? []) as AirlineInfo[];
}
