#!/usr/bin/env bash
# agents/researcher-queen/run.sh
# CLI: agy | Model: gemini-3.6-flash-high
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$HUB_ROOT/scripts/lib.sh"

require_workspace plan.md || exit 1

AGENT_INSTRUCTIONS="$(cat "$SCRIPT_DIR/AGENT.md")"
SKILL="$(read_skill web-search)"
PLAN="$(read_workspace plan.md)"

agy -p "
$AGENT_INSTRUCTIONS

---SKILL: web-search---
$SKILL

---CURRENT PLAN (from planner-queen)---
$PLAN

---TASK---
Research the above plan thoroughly. Use your web search capabilities to find
current best practices, recommended libraries, and known pitfalls.

Write your complete findings to the file:
$HUB_ROOT/workspace/research.md

Overwrite any existing content. Follow the output format in your instructions exactly.
" \
  --model gemini-3.6-flash-high \
  --dangerously-skip-permissions \
  --output-format text
