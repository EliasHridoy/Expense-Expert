#!/usr/bin/env bash
# agents/git-princess/run.sh
# CLI: agy | Model: gemini-3.1-pro-low
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$HUB_ROOT/scripts/lib.sh"

require_workspace plan.md || exit 1
require_workspace implementation.md || exit 1

AGENT_INSTRUCTIONS="$(cat "$SCRIPT_DIR/AGENT.md")"
SKILL="$(read_skill git-commit)"
PLAN="$(read_workspace plan.md)"
IMPLEMENTATION="$(read_workspace implementation.md)"
TEST_REPORT="$(read_workspace test-report.md)"

# Capture git status for context
GIT_STATUS="$(cd "$HUB_ROOT" && git status --short 2>&1 || echo 'Not a git repository')"
GIT_LOG="$(cd "$HUB_ROOT" && git log --oneline -5 2>&1 || echo 'No git log available')"
GIT_REMOTE="$(cd "$HUB_ROOT" && git remote -v 2>&1 || echo 'No remotes configured')"

agy -p "
$AGENT_INSTRUCTIONS

---SKILL: git-commit---
$SKILL

---PLAN (from planner-queen)---
$PLAN

---IMPLEMENTATION SUMMARY (from implementor-queen)---
$IMPLEMENTATION

---TEST REPORT (from tester-prince)---
$TEST_REPORT

---CURRENT GIT STATUS---
$GIT_STATUS

---RECENT GIT LOG---
$GIT_LOG

---GIT REMOTES---
$GIT_REMOTE

---TASK---
Working directory: $HUB_ROOT

1. Review the git status above
2. Stage the appropriate files (from implementation.md's 'Files Changed' list)
3. Write a conventional commit message based on the plan and implementation
4. Commit the staged changes
5. Push if a remote is configured

Write the git summary to:
$HUB_ROOT/workspace/git-summary.md

Follow the output format in your instructions exactly.
" \
  --model gemini-3.1-pro-low \
  --dangerously-skip-permissions \
  --output-format text
