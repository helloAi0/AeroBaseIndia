export interface Flight {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  status: "Scheduled" | "Boarding" | "Departed" | "Landed" | "Delayed" | "Cancelled";
  gate: string;
  predictedDelay?: number;
  airline?: string;
  departureTime?: string;
  arrivalTime?: string;
}

export interface HealthStatus {
  status: "healthy" | "degraded";
  database: "UP" | "DOWN";
  redis: "UP" | "DOWN";
  ai_engine: "UP" | "DOWN";
  timestamp: number;
}

export interface MetricCard {
  label: string;
  value: string | number;
  change?: number;
  icon: string;
  color: "blue" | "teal" | "green" | "yellow" | "red";
}

export interface PaymentOrder {
  order_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  checkout_url: string;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  operation: string;
  durationMs: number;
  status: number;
  tenantId: string;
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  logo?: string;
  primaryColor?: string;
}