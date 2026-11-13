/**
 * Runtime configuration (set in frontend/.env.local — see .env.example).
 *
 * VITE_API_URL            Backend base URL. Leave EMPTY for demo mode: the app makes
 *                         no network calls and uses built-in demo data.
 * VITE_ENABLE_DEMO_LOGIN  "true" lets the built-in demo accounts sign in when the backend
 *                         is unreachable. Always on in `npm run dev`; keep it OFF in production.
 */
export const API_URL = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
export const API_ENABLED = API_URL !== "";
export const DEMO_LOGIN_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === "true";

/** Show the "Try a demo account" panel on the sign-in page (display only — it just pre-fills the form). Always on in dev. */
export const SHOW_DEMO_ACCOUNTS = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === "true";
/** Password of the seeded demo accounts (scripts/seed_demo.py). Only used to pre-fill the form when the panel is shown. */
export const DEMO_PASSWORD = String(import.meta.env.VITE_DEMO_PASSWORD || "Demo-Pass-2026x");
