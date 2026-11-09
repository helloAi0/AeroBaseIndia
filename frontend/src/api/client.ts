import axios from "axios";
import { API_URL, API_ENABLED } from "../config";
import { useAuthStore } from "../store/authStore";

/** The backend reports some failures as HTTP 200 with `{ "error": "..." }`; we surface those as errors. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 200) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  // Demo mode: never touch the network (a relative URL would hit the page's own origin).
  if (!API_ENABLED) return Promise.reject(new ApiError("Demo mode: no API configured (set VITE_API_URL)", 0));
  const { token, user, source } = useAuthStore.getState();
  // Demo tokens ("tok_u001") are not JWTs — never send them to a real server.
  if (token && source === "backend") config.headers.Authorization = `Bearer ${token}`;
  config.headers["X-Tenant-ID"] = user?.airport || "DEL";
  return config;
});

api.interceptors.response.use(
  (res) => {
    const d = res.data;
    if (d && typeof d === "object" && !Array.isArray(d) && typeof d.error === "string" && d.error) {
      return Promise.reject(new ApiError(d.error, res.status));
    }
    return res;
  },
  (err) => {
    // Expired / invalid server session → sign out (demo sessions never hit this).
    if (err.response?.status === 401 && useAuthStore.getState().source === "backend") {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

// API functions (names kept stable — many pages import these)
export const fetchHealth     = ()              => api.get("/health").then(r => r.data);
export const fetchFlights    = ()              => api.get("/flights").then(r => r.data);
export const fetchMetrics    = ()              => api.get("/metrics").then(r => r.data);
export const fetchTraces     = ()              => api.get("/traces").then(r => r.data);
export const fetchOrders     = ()              => api.get("/payments/orders").then(r => r.data);
export const fetchEmailQueue = ()              => api.get("/notify/queue").then(r => r.data);
export const createOrder     = (body: object)  => api.post("/payments/order", body).then(r => r.data);
export const sendEmail       = (body: object)  => api.post("/notify/email", body).then(r => r.data);
export const graphqlQuery    = (query: string) => api.post("/graphql", { query }).then(r => r.data);
