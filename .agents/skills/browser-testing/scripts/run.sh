#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
cd "$REPO_ROOT"

# Check if dev server is running on port 4200
if ! curl -s --connect-timeout 2 http://localhost:4200 > /dev/null 2>&1; then
  echo "⚠️ Dev server is not running on http://localhost:4200."
  echo "🚀 Starting development server in background..."
  cd "$REPO_ROOT/expense-expert"
  nohup npm start > /tmp/expense-expert-dev.log 2>&1 &
  DEV_PID=$!
  echo "Dev server launched with PID $DEV_PID. Waiting for port 4200..."
  
  for i in {1..30}; do
    if curl -s --connect-timeout 1 http://localhost:4200 > /dev/null 2>&1; then
      echo "✅ Server is ready on http://localhost:4200."
      break
    fi
    sleep 2
  done
  cd "$REPO_ROOT"
fi

# Run test runner
exec node "$REPO_ROOT/expense-expert/scripts/browser-test-runner.js" "$@"
