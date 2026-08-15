#!/usr/bin/env bash
# agents/planner-queen/run.sh
# CLI: agy | Model: gemini-3.1-pro-high
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$HUB_ROOT/scripts/lib.sh"

require_workspace requirements.md || exit 1

AGENT_INSTRUCTIONS="$(cat "$SCRIPT_DIR/AGENT.md")"
SKILL="$(read_skill write-plan)"
REQUIREMENTS="$(read_workspace requirements.md)"
RESEARCH="$(read_workspace research.md)"

agy -p "
$AGENT_INSTRUCTIONS

---SKILL: write-plan---
$SKILL

---REQUIREMENTS (from user)---
$REQUIREMENTS

---PRIOR RESEARCH (from researcher-queen, may be empty on round 1)---
$RESEARCH

---TASK---
Write the complete, updated implementation plan to the file:
$HUB_ROOT/workspace/plan.md

Overwrite any existing content. Follow the output format in your instructions exactly.
" \
  --model gemini-3.1-pro-high \
  --dangerously-skip-permissions \
  --output-format text
