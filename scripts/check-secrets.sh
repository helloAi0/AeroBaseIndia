#!/usr/bin/env bash
# Fails if a tracked/staged file looks like it contains a real secret or is a key/env file.
# Usage: scripts/check-secrets.sh            (scan all tracked files)
#        scripts/check-secrets.sh --staged   (scan only staged changes; used by the pre-commit hook)
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
if [ "${1:-}" = "--staged" ]; then FILES=$(git diff --cached --name-only --diff-filter=ACM); else FILES=$(git ls-files); fi
fail=0
# 1) files that must never be committed
while IFS= read -r f; do
  case "$f" in
    .env|*/.env|.env.prod|*/.env.prod|*.pem|*.key|*.p12|*.pfx|*id_rsa*) echo "BLOCKED file: $f"; fail=1;;
  esac
done <<< "$FILES"
# 2) high-confidence secret patterns inside file contents
PATTERNS='AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|AC[a-f0-9]{32}|sk_live_[0-9a-zA-Z]{16,}|rzp_live_[0-9a-zA-Z]{10,}|ghp_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{40,}|xox[baprs]-[0-9A-Za-z-]{10,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|[0-9]{8,10}:AA[0-9A-Za-z_-]{33}|xkeysib-[a-f0-9]{40,}'
while IFS= read -r f; do
  [ -f "$f" ] || continue
  case "$f" in *.png|*.jpg|*.svg|*.ico|*.woff*|package-lock.json|scripts/check-secrets.sh) continue;; esac
  if grep -InEq "$PATTERNS" "$f" 2>/dev/null; then echo "POSSIBLE SECRET in $f:"; grep -InE "$PATTERNS" "$f" | sed -E 's/(.{6})[^ ]{8,}/\1…(redacted)/' | head -3; fail=1; fi
done <<< "$FILES"
[ $fail -eq 0 ] && echo "No secrets found." || { echo "Secret check FAILED. Remove the secret (and rotate it if it was real)."; exit 1; }
