#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-http://localhost:8000}

echo "Running backend health checks against ${BASE_URL}"
python3 "$(dirname "$0")/health_check.py" "$BASE_URL"

echo "Running signed URL smoke test against ${BASE_URL}"
python3 "$(dirname "$0")/test_signed_url.py" "$BASE_URL"

echo "All checks passed."
