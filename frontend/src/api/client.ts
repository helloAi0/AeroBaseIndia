// @silence-offline — backend errors suppressed in frontend-only mode
const _origErr = console.error.bind(console);
console.error = (...a: unknown[]) => {
  const s = String(a[0]??'');
  if(s.includes('ERR_CONNECTION_REFUSED')||s.includes('Failed to load resource')||s.includes('favicon')) return;
  _origErr(...a);
};
const _origWarn = console.warn.bind(console);
console.warn = (...a: unknown[]) => {
  const s = String(a[0]??'');
  if(s.includes('ERR_CONNECTION_REFUSED')) return;
  _origWarn(...a);
};

// Silence backend connection errors in frontend-only mode
if (typeof window !== "undefined") {
  const origError = console.error;
  console.error = (...args: any[]) => {
    const msg = String(args[0] || "");
    if (msg.includes("ERR_CONNECTION_REFUSED") || msg.includes("Failed to load resource")) return;
    origError(...args);
  };
}

import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token    = localStorage.getItem("token");
  const tenantId = localStorage.getItem("tenantId") || "DEL";
  if (token)    config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers["X-Tenant-ID"] = tenantId;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) localStorage.removeItem("token");
    return Promise.reject(err);
  }
);

// API functions
export const fetchHealth    = ()              => api.get("/health").then(r => r.data);
export const fetchFlights   = ()              => api.get("/flights").then(r => r.data);
export const fetchMetrics   = ()              => api.get("/metrics").then(r => r.data);
export const fetchTraces    = ()              => api.get("/traces").then(r => r.data);
export const fetchOrders    = ()              => api.get("/payments/orders").then(r => r.data);
export const fetchEmailQueue= ()              => api.get("/notify/queue").then(r => r.data);
export const createOrder    = (body: object) => api.post("/payments/order", body).then(r => r.data);
export const sendEmail      = (body: object) => api.post("/notify/email", body).then(r => r.data);
export const graphqlQuery   = (query: string)=>
  api.post("/graphql", { query }).then(r => r.data);