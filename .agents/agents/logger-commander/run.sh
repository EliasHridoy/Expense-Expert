#!/usr/bin/env bash
# agents/logger-commander/run.sh
# CLI: agy | Model: gemini-3.6-flash-low
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$HUB_ROOT/scripts/lib.sh"

AGENT_INSTRUCTIONS="$(cat "$SCRIPT_DIR/AGENT.md")"

# Collect all workspace files (excluding changelog files — they're the output)
ALL_CONTEXT=""
for f in "$HUB_ROOT/workspace/"*.md; do
  [[ -f "$f" ]] || continue
  basename_f="$(basename "$f")"
  [[ "$basename_f" == changelog-* ]] && continue
  ALL_CONTEXT+="
=== $basename_f ===
$(cat "$f")
"
done

TOPIC="${TOPIC:-session}"
CHANGELOG_FILE="$HUB_ROOT/workspace/changelog-${TOPIC}.md"
CURRENT_TIME="$(timestamp)"

agy -p "
$AGENT_INSTRUCTIONS

---SESSION INFO---
Topic: $TOPIC
Timestamp: $CURRENT_TIME
Changelog file: $CHANGELOG_FILE

---WORKSPACE CONTEXT (all session files)---
$ALL_CONTEXT

---TASK---
Read the workspace context above and write a changelog entry.

CRITICAL: APPEND the entry to the file — do NOT overwrite existing content.
Use >> redirection, not > (or use a file write tool that appends).
Target file: $CHANGELOG_FILE

The entry must start with:
## $CURRENT_TIME — <topic title in Title Case>

Follow the output format in your instructions exactly.
End the entry with a --- horizontal rule on its own line.
" \
  --model gemini-3.6-flash-low \
  --dangerously-skip-permissions \
  --output-format text
