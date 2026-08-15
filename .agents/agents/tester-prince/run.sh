#!/usr/bin/env bash
# agents/tester-prince/run.sh
# CLI: agy | Model: gemini-3.5-flash-medium
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$HUB_ROOT/scripts/lib.sh"

require_workspace plan.md || exit 1
require_workspace implementation.md || exit 1

AGENT_INSTRUCTIONS="$(cat "$SCRIPT_DIR/AGENT.md")"
SKILL="$(read_skill write-test-report)"
PLAN="$(read_workspace plan.md)"
IMPLEMENTATION="$(read_workspace implementation.md)"

agy -p "
$AGENT_INSTRUCTIONS

---SKILL: write-test-report---
$SKILL

---PLAN (from planner-queen)---
$PLAN

---IMPLEMENTATION SUMMARY (from implementor-queen)---
$IMPLEMENTATION

---TASK---
1. Run the available test commands for this project (try pytest, npm test, go test, etc.)
2. Validate the implementation against every task's acceptance criteria in the plan
3. Check for security issues, missing error handling, and edge cases

Write your complete test report to:
$HUB_ROOT/workspace/test-report.md

CRITICAL: The very first line of the file MUST be exactly one of:
  STATUS: PASS
  STATUS: FAIL
  STATUS: PARTIAL

This line is machine-parsed by the pipeline orchestrator.
Follow the output format in your instructions exactly.
" \
  --model gemini-3.5-flash-medium \
  --dangerously-skip-permissions \
  --output-format text
