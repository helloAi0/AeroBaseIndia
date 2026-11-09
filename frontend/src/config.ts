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
