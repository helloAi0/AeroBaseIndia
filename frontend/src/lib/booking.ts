export const STAGES = ["Booked", "Checked in", "Bag dropped", "Security cleared", "Boarded"] as const;
export interface Traveller { name: string; email?: string; userId?: string; seat: string; stage: (typeof STAGES)[number] }
export interface Fare { perTraveller: number; base: number; fees: number; total: number; pro: boolean; distanceKm: number; seatsLeft: number; travellers: number }
export interface Booking { id: string; pnr: string; flightId: string; flight: string; origin: string; destination: string; dep: string; airline: string; airlineName?: string; aircraft?: string; terminal?: string; gate?: string; travellers: Traveller[]; fare: Fare; status: "Confirmed" | "Cancelled"; payment: "Paid" | "Unpaid"; bookedBy?: string; bookedByEmail?: string; created_at?: string }
/** Reference ID a passenger can share so others can add them to a booking (shown on their trips page). */
export const paxRef = (userId?: string) => (userId ? "PAX-" + userId.replace(/-/g, "").slice(0, 6).toUpperCase() : "");
export const stageIndex = (s: string) => Math.max(0, STAGES.indexOf(s as (typeof STAGES)[number]));
/** Boarding closes 40 minutes before departure; the pass shows boarding at that time. */
export function boardingTime(dep: string): string { const [h, m] = (dep.includes("T") ? dep.split("T")[1] : dep).split(":").map(Number); const t = (h * 60 + m - 40 + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; }
export const hhmm = (dep: string) => (dep.includes("T") ? dep.split("T")[1].slice(0, 5) : dep.slice(0, 5));
export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
