#!/usr/bin/env bash
# Runs the frontend unit tests, then the API integration tests if a backend is reachable.
#   scripts/run-tests.sh                      # BASE_URL defaults to http://localhost:8080
#   REQUIRE_BACKEND=1 scripts/run-tests.sh    # fail (instead of skip) when no backend is running
set -uo pipefail
cd "$(dirname "$0")/.."
BASE_URL="${BASE_URL:-http://localhost:8080}"; export BASE_URL
fail=0

echo "== Frontend unit tests =="
( cd frontend && { [ -x node_modules/.bin/vitest ] || npm ci; } && npm test --silent ) || fail=1

echo; echo "== API integration tests ($BASE_URL) =="
if curl -fsS -m 5 "$BASE_URL/health" >/dev/null 2>&1; then
  python3 scripts/integration_test.py || fail=1
elif [ "${REQUIRE_BACKEND:-0}" = "1" ]; then
  echo "Backend not reachable at $BASE_URL"; fail=1
else
  echo "Backend not reachable at $BASE_URL - skipped (start it, run scripts/seed_demo.py, then re-run)."
fi

echo; [ $fail -eq 0 ] && echo "ALL TESTS PASSED" || echo "TESTS FAILED"
exit $fail
