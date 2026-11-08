#!/bin/bash
# AeroBase India — wrk Benchmark Suite
# Usage: bash load-tests/wrk-benchmark.sh

BASE="http://localhost:8080"
DURATION=30
THREADS=4
CONNECTIONS=100

echo "================================================"
echo " AeroBase India — Performance Benchmark"
echo " Duration: ${DURATION}s | Threads: ${THREADS} | Connections: ${CONNECTIONS}"
echo "================================================"

run_benchmark() {
    local name=$1
    local url=$2
    local extra_args=$3
    echo ""
    echo "--- $name ---"
    wrk -t${THREADS} -c${CONNECTIONS} -d${DURATION}s $extra_args "$url"
}

# Health endpoint
run_benchmark "GET /health" "${BASE}/health"

# Flights endpoint
run_benchmark "GET /flights" "${BASE}/flights" \
    "-H 'X-Tenant-ID: DEL'"

# Metrics endpoint
run_benchmark "GET /metrics" "${BASE}/metrics"

# Traces endpoint
run_benchmark "GET /traces" "${BASE}/traces"

# GraphQL endpoint (POST)
cat > /tmp/graphql-post.lua << 'LUA'
wrk.method = "POST"
wrk.headers["Content-Type"] = "application/json"
wrk.headers["X-Tenant-ID"] = "DEL"
wrk.body = '{"query":"{ healthStatus { api database redis } }"}'
LUA

run_benchmark "POST /graphql" "${BASE}/graphql" \
    "-s /tmp/graphql-post.lua"

echo ""
echo "================================================"
echo " Benchmark Complete"
echo "================================================"
