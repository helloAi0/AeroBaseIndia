import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate    = new Rate('error_rate');
const healthTrend  = new Trend('health_duration');
const flightTrend  = new Trend('flights_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10  }, // ramp up
    { duration: '1m',  target: 10  }, // hold
    { duration: '15s', target: 0   }, // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed:   ['rate<0.01'],  // less than 1% errors
    error_rate:        ['rate<0.05'],
  },
};

const BASE = 'http://localhost:8080';
const TENANT = 'DEL';

export default function () {
  // Health check
  let r1 = http.get(`${BASE}/health`);
  check(r1, { 'health 200': (r) => r.status === 200 });
  healthTrend.add(r1.timings.duration);
  errorRate.add(r1.status !== 200);

  // Flights list
  let r2 = http.get(`${BASE}/flights`, {
    headers: { 'X-Tenant-ID': TENANT }
  });
  check(r2, { 'flights 200': (r) => r.status === 200 });
  flightTrend.add(r2.timings.duration);

  // Metrics endpoint
  let r3 = http.get(`${BASE}/metrics`);
  check(r3, { 'metrics 200': (r) => r.status === 200 });

  // GraphQL
  let r4 = http.post(`${BASE}/graphql`,
    JSON.stringify({ query: '{ healthStatus { api database redis } }' }),
    { headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT } }
  );
  check(r4, { 'graphql 200': (r) => r.status === 200 });

  sleep(1);
}
