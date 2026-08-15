#!/usr/bin/env bash
# =============================================================================
# scripts/lib.sh — Shared utilities for agent-hub
# Sourced by: hub.sh and every agents/<name>/run.sh
# =============================================================================

# Resolve hub root relative to this file's location
HUB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENTS_DIR="$HUB_ROOT/agents"
WORKSPACE_DIR="$HUB_ROOT/workspace"
SKILLS_DIR="$HUB_ROOT/skills"

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
log() {
  echo "[$(date '+%H:%M:%S')] $*" >&2
}

log_ok()   { echo "[$(date '+%H:%M:%S')] ✓ $*" >&2; }
log_warn() { echo "[$(date '+%H:%M:%S')] ⚠  $*" >&2; }
log_err()  { echo "[$(date '+%H:%M:%S')] ✗ $*" >&2; }

# -----------------------------------------------------------------------------
# Workspace helpers
# -----------------------------------------------------------------------------

# Read a workspace file; returns empty string if missing
read_workspace() {
  local file="$WORKSPACE_DIR/$1"
  if [[ -f "$file" ]]; then
    cat "$file"
  else
    echo ""
  fi
}

# Write to workspace file (creates parent dirs if needed)
write_workspace() {
  local file="$WORKSPACE_DIR/$1"
  mkdir -p "$(dirname "$file")"
  cat > "$file"
}

# Check if a workspace file is non-empty
workspace_has() {
  local file="$WORKSPACE_DIR/$1"
  [[ -s "$file" ]]
}

# Read a skill file by directory name
read_skill() {
  local skill="$SKILLS_DIR/$1/SKILL.md"
  if [[ -f "$skill" ]]; then
    cat "$skill"
  else
    log_warn "Skill not found: $1"
    echo ""
  fi
}

# Collect all workspace files into one string (for logger-commander)
read_all_workspace() {
  local out=""
  for f in "$WORKSPACE_DIR"/*.md; do
    [[ -f "$f" ]] || continue
    local name
    name="$(basename "$f")"
    out+="
=== $name ===
$(cat "$f")
"
  done
  echo "$out"
}

# -----------------------------------------------------------------------------
# Agent runner
# -----------------------------------------------------------------------------
run_agent() {
  local name="$1"
  local agent_script="$AGENTS_DIR/$name/run.sh"

  if [[ ! -f "$agent_script" ]]; then
    log_err "Agent not found: $name (looked for $agent_script)"
    return 1
  fi

  if [[ ! -x "$agent_script" ]]; then
    log_err "Agent run.sh is not executable: $agent_script"
    log_warn "Run: chmod +x $agent_script"
    return 1
  fi

  log "▶ Running agent: $name"
  bash "$agent_script"
  log_ok "Agent $name completed"
}

# -----------------------------------------------------------------------------
# Misc utilities
# -----------------------------------------------------------------------------

# Timestamp for changelog entries
timestamp() {
  date '+%Y-%m-%d %H:%M'
}

# Ensure required workspace files exist before an agent runs
require_workspace() {
  local missing=0
  for f in "$@"; do
    if ! workspace_has "$f"; then
      log_err "Required workspace file missing or empty: $f"
      missing=1
    fi
  done
  return $missing
}
