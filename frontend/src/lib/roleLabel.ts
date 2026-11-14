/** Human label for a signed-in user's role (pilots and airline staff arrive as role "staff" with a staffLevel). */
export function roleLabel(u?: { role?: string; staffLevel?: string } | null): string {
  if (!u) return "Guest";
  const sl = u.staffLevel ?? "";
  if (u.role === "superadmin") return "Platform owner";
  if (u.role === "airport_admin") return "Airport director";
  if (u.role === "retailer") return "Shop owner";
  if (u.role === "staff") {
    if (sl.startsWith("pilot_")) return `Pilot · ${sl.split("_").pop()?.toUpperCase()}`;
    if (sl.startsWith("airline_")) return `Airline ops · ${sl.split("_").pop()?.toUpperCase()}`;
    if (sl === "staff_security") return "Security";
    return "Ground staff";
  }
  return "Passenger";
}
