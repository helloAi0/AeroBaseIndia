#!/usr/bin/env bash
# Local-development TLS certificate (self-signed). NEVER use for production — use Let's Encrypt / your CA.
set -euo pipefail
mkdir -p "$(dirname "$0")/../certs" && cd "$(dirname "$0")/../certs"
openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=localhost" -keyout server.key -out server.crt
chmod 600 server.key
echo "Created certs/server.{crt,key} (git-ignored)."
