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

export interface SignupInput { name: string; email: string; password: string; airport: string; account_type: "PASSENGER" | "RETAILER"; shop?: string; }
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
