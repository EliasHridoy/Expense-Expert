#!/usr/bin/env bash
# agents/implementor-queen/run.sh
# CLI: auto-selected at runtime
#   - codex  → when workspace/design-spec.md or workspace/design.html exist (frontend task)
#   - opencode → otherwise (backend / general task)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$HUB_ROOT/scripts/lib.sh"

require_workspace plan.md || exit 1

AGENT_INSTRUCTIONS="$(cat "$SCRIPT_DIR/AGENT.md")"
PLAN="$(read_workspace plan.md)"
DESIGN_SPEC="$(read_workspace design-spec.md)"
DESIGN_HTML="$(read_workspace design.html)"

# ---------------------------------------------------------------------------
# Auto-detect CLI: frontend (codex) vs backend/general (opencode)
# ---------------------------------------------------------------------------
IS_FRONTEND=false
[[ -s "$HUB_ROOT/workspace/design-spec.md" ]] && IS_FRONTEND=true
[[ -s "$HUB_ROOT/workspace/design.html" ]]     && IS_FRONTEND=true

PROMPT="$AGENT_INSTRUCTIONS

---PLAN (from planner-queen)---
$PLAN

---DESIGN SPEC (from designer-queen — empty if backend task)---
$DESIGN_SPEC

---DESIGN HTML REFERENCE MOCKUP (from designer-queen — empty if backend task)---
$DESIGN_HTML

---TASK---
Implement all tasks from the plan. Meet every acceptance criterion listed.
When implementation is complete, write a summary to:
$HUB_ROOT/workspace/implementation.md

Follow the output format in your instructions exactly.
"

if [[ "$IS_FRONTEND" == "true" ]]; then
  log "implementor-queen: 🎨 Frontend task detected (design files present) → using codex"
  printf '%s\n' "$PROMPT" | codex exec \
    --dangerously-bypass-approvals-and-sandbox \
    -
else
  log "implementor-queen: ⚙️  Backend/general task detected → using opencode"
  printf '%s\n' "$PROMPT" | opencode run --auto
fi
