import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '1m',  target: 50  }, // ramp to 50 users
    { duration: '2m',  target: 50  }, // hold at 50
    { duration: '1m',  target: 100 }, // ramp to 100
    { duration: '2m',  target: 100 }, // hold at 100
    { duration: '1m',  target: 200 }, // spike to 200
    { duration: '30s', target: 200 }, // hold spike
    { duration: '1m',  target: 0   }, // recover
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'], // 99% under 2s
    http_req_failed:   ['rate<0.05'],  // under 5% errors
  },
};

const BASE = 'http://localhost:8080';

export default function () {
  const endpoints = [
    () => http.get(`${BASE}/health`),
    () => http.get(`${BASE}/flights`, {
      headers: { 'X-Tenant-ID': 'DEL' }
    }),
    () => http.post(`${BASE}/graphql`,
      JSON.stringify({ query: '{ healthStatus { api } }' }),
      { headers: { 'Content-Type': 'application/json' } }
    ),
    () => http.get(`${BASE}/metrics`),
    () => http.get(`${BASE}/traces`),
    () => http.get(`${BASE}/payments/orders`, {
      headers: { 'X-Tenant-ID': 'DEL' }
    }),
  ];

  // Pick random endpoint
  const fn = endpoints[Math.floor(Math.random() * endpoints.length)];
  const r = fn();
  errorRate.add(r.status >= 400);
  check(r, { 'status < 500': (r) => r.status < 500 });
  sleep(0.5);
}
