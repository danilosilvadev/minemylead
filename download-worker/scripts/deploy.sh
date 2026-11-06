#!/usr/bin/env bash
# One command: log in to Cloudflare if needed, apply the database migrations, deploy the Worker, and check that the form endpoint answers the browser.
# Usage: bash download-worker/scripts/deploy.sh      (run it from the feat/interest-landing branch: main lacks the workers.dev setting)
set -euo pipefail
cd "$(dirname "$(readlink -f "$0")")/.."
npx --yes wrangler whoami >/dev/null 2>&1 || npx --yes wrangler login
yes | npx --yes wrangler d1 migrations apply mml-downloads --remote
npx --yes wrangler deploy
echo "--- checking the form endpoint (preflight from minemylead.com)"
code=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS -H "Origin: https://minemylead.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type" https://mml-downloads.markpetrelli.workers.dev/api/intake)
[ "$code" = "204" ] && echo "OK: the form endpoint answers (204)" || { echo "NOT OK: preflight answered $code"; exit 1; }
