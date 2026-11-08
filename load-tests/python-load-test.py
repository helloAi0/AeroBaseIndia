#!/usr/bin/env python3
"""
AeroBase India — Built-in Load Tester
No external dependencies needed — uses only stdlib
"""
import threading
import urllib.request
import urllib.error
import time
import json
import statistics
import sys

BASE = "http://localhost:8080"
RESULTS = []
LOCK = threading.Lock()

def make_request(url, method="GET", data=None, headers=None):
    start = time.time()
    try:
        req = urllib.request.Request(url, method=method)
        if headers:
            for k, v in headers.items():
                req.add_header(k, v)
        if data:
            req.data = json.dumps(data).encode()
            req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=5) as resp:
            duration = (time.time() - start) * 1000
            with LOCK:
                RESULTS.append({"status": resp.status, "duration": duration, "url": url})
    except Exception as e:
        duration = (time.time() - start) * 1000
        with LOCK:
            RESULTS.append({"status": 0, "duration": duration, "url": url, "error": str(e)})

def worker(num_requests):
    endpoints = [
        (f"{BASE}/health",   "GET",  None, {}),
        (f"{BASE}/flights",  "GET",  None, {"X-Tenant-ID": "DEL"}),
        (f"{BASE}/metrics",  "GET",  None, {}),
        (f"{BASE}/traces",   "GET",  None, {}),
        (f"{BASE}/graphql",  "POST",
         {"query": "{ healthStatus { api } }"},
         {"X-Tenant-ID": "DEL"}),
    ]
    for _ in range(num_requests):
        import random
        url, method, data, headers = random.choice(endpoints)
        make_request(url, method, data, headers)

def run_load_test(concurrent_users=10, requests_per_user=20):
    print(f"\n{'='*55}")
    print(f" AeroBase India — Load Test")
    print(f" Users: {concurrent_users} | Requests/user: {requests_per_user}")
    print(f" Total requests: {concurrent_users * requests_per_user}")
    print(f"{'='*55}")

    RESULTS.clear()
    start = time.time()

    threads = []
    for _ in range(concurrent_users):
        t = threading.Thread(target=worker, args=(requests_per_user,))
        threads.append(t)

    for t in threads:
        t.start()
    for t in threads:
        t.join()

    total_time = time.time() - start

    # Analyze results
    durations   = [r["duration"] for r in RESULTS]
    success     = [r for r in RESULTS if r.get("status", 0) == 200]
    errors      = [r for r in RESULTS if r.get("status", 0) != 200]

    print(f"\n{'─'*55}")
    print(f" Results")
    print(f"{'─'*55}")
    print(f" Total requests:  {len(RESULTS)}")
    print(f" Successful:      {len(success)}")
    print(f" Errors:          {len(errors)}")
    print(f" Error rate:      {len(errors)/len(RESULTS)*100:.1f}%")
    print(f" Total time:      {total_time:.2f}s")
    print(f" RPS:             {len(RESULTS)/total_time:.1f}")
    print(f"{'─'*55}")

    if durations:
        print(f" Latency (ms):")
        print(f"   Min:          {min(durations):.1f}")
        print(f"   Max:          {max(durations):.1f}")
        print(f"   Mean:         {statistics.mean(durations):.1f}")
        print(f"   Median:       {statistics.median(durations):.1f}")
        sdurations = sorted(durations)
        p95 = sdurations[int(len(sdurations)*0.95)]
        p99 = sdurations[int(len(sdurations)*0.99)]
        print(f"   P95:          {p95:.1f}")
        print(f"   P99:          {p99:.1f}")

    print(f"{'─'*55}")

    # Per endpoint breakdown
    print(f"\n Endpoint Breakdown:")
    by_url = {}
    for r in RESULTS:
        url = r["url"].replace(BASE, "")
        by_url.setdefault(url, []).append(r["duration"])
    for url, times in sorted(by_url.items()):
        print(f"   {url:<30} avg={statistics.mean(times):.1f}ms  "
              f"n={len(times)}")

    print(f"\n{'='*55}")

    # Pass/Fail
    error_rate = len(errors)/len(RESULTS)
    p95_ok     = sorted(durations)[int(len(durations)*0.95)] < 500
    if error_rate < 0.05 and p95_ok:
        print(" RESULT: PASS ✅")
    else:
        print(" RESULT: FAIL ❌")
        if error_rate >= 0.05:
            print(f"   Error rate {error_rate*100:.1f}% >= 5%")
        if not p95_ok:
            print(f"   P95 latency too high")
    print(f"{'='*55}\n")

if __name__ == "__main__":
    # Quick smoke
    print("Running smoke test (10 users, 10 req each)...")
    run_load_test(concurrent_users=10, requests_per_user=10)

    time.sleep(2)

    # Medium load
    print("Running medium load test (25 users, 20 req each)...")
    run_load_test(concurrent_users=25, requests_per_user=20)

    time.sleep(2)

    # Heavy load
    print("Running heavy load test (50 users, 20 req each)...")
    run_load_test(concurrent_users=50, requests_per_user=20)
