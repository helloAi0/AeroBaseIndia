import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m',  target: 20 },
    { duration: '15s', target: 0  },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed:   ['rate<0.02'],
  },
};

const BASE = 'http://localhost:8080';

let orderCount = 0;

export default function () {
  // Create payment order
  const payload = JSON.stringify({
    invoice_id: `INV-LOAD-${__VU}-${orderCount++}`,
    amount: 9999 + Math.random() * 100000,
    currency: 'INR',
    gateway: Math.random() > 0.5 ? 'razorpay' : 'stripe',
  });

  const r1 = http.post(`${BASE}/payments/order`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': 'DEL',
    },
  });

  check(r1, {
    'order created':    (r) => r.status === 200,
    'has checkout_url': (r) => JSON.parse(r.body).checkout_url !== undefined,
    'has order_id':     (r) => JSON.parse(r.body).order_id !== undefined,
  });

  // List orders
  const r2 = http.get(`${BASE}/payments/orders`, {
    headers: { 'X-Tenant-ID': 'DEL' },
  });
  check(r2, { 'orders listed': (r) => r.status === 200 });

  sleep(1);
}
