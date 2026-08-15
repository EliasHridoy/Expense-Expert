#!/usr/bin/env bash
# =============================================================================
# hub.sh — Personal Agent Hub Orchestrator
# =============================================================================
# Usage:
#   TOPIC="user-auth" ./hub.sh                         # full pipeline
#   TOPIC="user-auth" ./hub.sh --skip designer-queen   # skip an optional agent
#   ./hub.sh --only planner-queen                      # run one agent in isolation
#   ./hub.sh --only "planner-queen researcher-queen"   # run specific agents in order
#
# Environment:
#   TOPIC     — used for changelog filename: changelog-<TOPIC>.md (default: session)
#   SKIP      — agent name to skip (alternative to --skip flag)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scripts/lib.sh"

TOPIC="${TOPIC:-session}"
ONLY=""
SKIP_AGENT=""
PLANNING_ROUNDS="${PLANNING_ROUNDS:-3}"
MAX_IMPL_RETRIES="${MAX_IMPL_RETRIES:-2}"

# ---------------------------------------------------------------------------
# Parse flags
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)  ONLY="$2";       shift 2 ;;
    --skip)  SKIP_AGENT="$2"; shift 2 ;;
    --topic) TOPIC="$2";      shift 2 ;;
    --rounds) PLANNING_ROUNDS="$2"; shift 2 ;;
    --help|-h)
      cat <<EOF
hub.sh — Personal Agent Hub Orchestrator

USAGE:
  TOPIC=<topic> ./hub.sh [OPTIONS]

OPTIONS:
  --only  <agent-name>    Run only this agent (or quoted list of agents)
  --skip  <agent-name>    Skip this agent in the full pipeline
  --topic <name>          Set changelog topic name (overrides TOPIC env var)
  --rounds <n>            Number of planner<->researcher rounds (default: 3)
  --help                  Show this help

AGENTS:
  planner-queen       👑  (agy, gemini-3.1-pro-high)
  researcher-queen    🔍  (agy, gemini-3.6-flash-high)
  designer-queen      🎨  (agy, gemini-3.6-flash-medium)  [optional]
  implementor-queen   ⚙️   (auto: codex=frontend / opencode=backend)
  tester-prince       ✅  (agy, gemini-3.5-flash-medium)
  git-princess        🚀  (agy, gemini-3.1-pro-low)
  logger-commander    📝  (agy, gemini-3.6-flash-low)

EXAMPLES:
  TOPIC="auth-feature" ./hub.sh
  TOPIC="auth-feature" ./hub.sh --skip designer-queen
  ./hub.sh --only planner-queen
  ./hub.sh --only researcher-queen
EOF
      exit 0
      ;;
    *) log_warn "Unknown argument: $1"; shift ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
should_skip() {
  [[ "$SKIP_AGENT" == "$1" ]]
}

export TOPIC

# ---------------------------------------------------------------------------
# --only: run a specific agent (or space-separated list) and exit
# ---------------------------------------------------------------------------
if [[ -n "$ONLY" ]]; then
  for agent in $ONLY; do
    run_agent "$agent"
  done
  exit 0
fi

# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------
log "════════════════════════════════════════════"
log "  Agent Hub Pipeline  |  TOPIC: $TOPIC"
log "════════════════════════════════════════════"

# Guard: requirements.md must exist
if ! workspace_has requirements.md; then
  log_err "workspace/requirements.md is missing or empty."
  log_err "Write your requirements there first, then re-run hub.sh"
  exit 1
fi

# ---------------------------------------------------------------------------
# Phase 1: Planning loop (N rounds of planner-queen ↔ researcher-queen)
# ---------------------------------------------------------------------------
log ""
log "── Phase 1: Planning ($PLANNING_ROUNDS rounds) ──"
for i in $(seq 1 "$PLANNING_ROUNDS"); do
  log "  Round $i / $PLANNING_ROUNDS"
  run_agent planner-queen
  run_agent researcher-queen
done
log "  Final planning pass (incorporating all research)"
run_agent planner-queen

# ---------------------------------------------------------------------------
# Phase 2: Design (optional)
# ---------------------------------------------------------------------------
log ""
log "── Phase 2: Design ──"
if should_skip designer-queen; then
  log_warn "  Skipping designer-queen (--skip flag)"
else
  run_agent designer-queen
fi

# ---------------------------------------------------------------------------
# Phase 3: Implementation (with retry on test failure)
# ---------------------------------------------------------------------------
log ""
log "── Phase 3: Implementation ──"
run_agent implementor-queen

# ---------------------------------------------------------------------------
# Phase 4: Test → retry implementation on failure (up to MAX_IMPL_RETRIES)
# ---------------------------------------------------------------------------
log ""
log "── Phase 4: Testing ──"
IMPL_ATTEMPT=1
while true; do
  run_agent tester-prince

  # Read STATUS from first line of test-report.md
  STATUS=""
  if workspace_has test-report.md; then
    STATUS=$(grep -m1 "^STATUS:" "$WORKSPACE_DIR/test-report.md" | awk '{print $2}' || echo "UNKNOWN")
  fi

  log "  Test result: STATUS=$STATUS (attempt $IMPL_ATTEMPT)"

  if [[ "$STATUS" == "PASS" ]]; then
    log_ok "  Tests passed — proceeding"
    break
  fi

  if [[ $IMPL_ATTEMPT -ge $((MAX_IMPL_RETRIES + 1)) ]]; then
    log_warn "  Max retries reached ($MAX_IMPL_RETRIES). Proceeding with STATUS=$STATUS"
    break
  fi

  log_warn "  Tests failed — re-running implementor-queen (attempt $((IMPL_ATTEMPT + 1)))"
  IMPL_ATTEMPT=$((IMPL_ATTEMPT + 1))
  run_agent implementor-queen
done

# ---------------------------------------------------------------------------
# Phase 5: Git
# ---------------------------------------------------------------------------
log ""
log "── Phase 5: Git ──"
run_agent git-princess

# ---------------------------------------------------------------------------
# Phase 6: Log
# ---------------------------------------------------------------------------
log ""
log "── Phase 6: Logging ──"
run_agent logger-commander

log ""
log "════════════════════════════════════════════"
log_ok "Pipeline complete!  TOPIC: $TOPIC"
log "  Changelog: workspace/changelog-${TOPIC}.md"
log "════════════════════════════════════════════"
