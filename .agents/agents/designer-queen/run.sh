#!/usr/bin/env bash
# agents/designer-queen/run.sh
# CLI: agy | Model: gemini-3.6-flash-medium
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$HUB_ROOT/scripts/lib.sh"

require_workspace plan.md || exit 1

AGENT_INSTRUCTIONS="$(cat "$SCRIPT_DIR/AGENT.md")"
FRONTEND_SKILL="$(read_skill frontend-design)"
PLAN="$(read_workspace plan.md)"

agy -p "
$AGENT_INSTRUCTIONS

---SKILL: frontend-design---
$FRONTEND_SKILL

---PLAN (from planner-queen)---
$PLAN

---TASK---
Produce two output files:

1. $HUB_ROOT/workspace/design-spec.md
   — Visual design specification (palette, typography, layout, components, motion)
   — Follow the output format in your instructions exactly

2. $HUB_ROOT/workspace/design.html
   — Self-contained HTML/CSS/JS mockup
   — Inline all styles and scripts (no external dependencies except one Google Fonts link)
   — Must be visually distinctive and match the product described in the plan
   — Must be mobile-responsive

Write both files completely. Do not truncate or placeholder either.
Apply all principles from the frontend-design skill.
" \
  --model gemini-3.6-flash-medium \
  --dangerously-skip-permissions \
  --output-format text
