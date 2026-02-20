#!/bin/bash

# ─────────────────────────────────────────────
# InvestIQ — Autonomous session runner
# Monitors Claude Code token usage via stream-json
# Stops gracefully at 90-95% context usage
# ─────────────────────────────────────────────

THRESHOLD=0.90
LOG_FILE=".claude-session.log"
USAGE_FILE=".claude-usage.tmp"

echo "🚀 InvestIQ autonomous session starting..."
echo "📊 Will stop automatically at 90% context usage"
echo "📝 Logging to $LOG_FILE"
echo ""

trap 'rm -f "$USAGE_FILE"' EXIT

claude --dangerously-skip-permissions \
  --output-format stream-json \
  --max-turns 100 \
  -p "Read PROGRESS.md and MVP.md.
      Find the first unchecked backlog item.
      Complete it fully.
      Then immediately move to the next unchecked item and complete it.
      Keep completing items sequentially without stopping or asking for confirmation.
      After completing each item: commit, push, update PROGRESS.md, then continue.
      Only stop when you determine your context window is 90-95% full —
      at that point finish the current item cleanly, do a final commit and push,
      write STOPPING: context near limit to PROGRESS.md session log, then exit.
      Follow the Autonomous Execution Contract at all times." \
  2>&1 | tee "$LOG_FILE" | while IFS= read -r line; do

    echo "$line"

    if echo "$line" | grep -q '"usage"'; then
      INPUT=$(echo "$line" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    usage = data.get('usage', {})
    inp = usage.get('input_tokens', 0)
    cache = usage.get('cache_read_input_tokens', 0)
    print(inp + cache)
except:
    print(0)
" 2>/dev/null)

      LIMIT=200000

      if [ -n "$INPUT" ] && [ "$INPUT" -gt 0 ] 2>/dev/null; then
        USAGE_PCT=$(python3 -c "print(round($INPUT / $LIMIT, 3))" 2>/dev/null)
        BAR_FILLED=$(python3 -c "print(int($INPUT / $LIMIT * 20))" 2>/dev/null)
        BAR_EMPTY=$(python3 -c "print(20 - int($INPUT / $LIMIT * 20))" 2>/dev/null)
        BAR=$(printf '█%.0s' $(seq 1 $BAR_FILLED 2>/dev/null))$(printf '░%.0s' $(seq 1 $BAR_EMPTY 2>/dev/null))
        echo "  ┌─ Context: [$BAR] $(python3 -c "print(f'{float($USAGE_PCT)*100:.1f}')")% ($INPUT / $LIMIT tokens)" >&2
        echo "$USAGE_PCT" > "$USAGE_FILE"

        OVER=$(python3 -c "print(1 if float('$USAGE_PCT') >= $THRESHOLD else 0)" 2>/dev/null)
        if [ "$OVER" = "1" ]; then
          echo "" >&2
          echo "⚠️  Context at $(python3 -c "print(f'{float($USAGE_PCT)*100:.1f}')")% — sending stop signal..." >&2
          pkill -SIGTERM -f "claude --dangerously-skip-permissions" 2>/dev/null
        fi
      fi
    fi
  done

echo ""
echo "✅ Session complete."
if [ -f "$USAGE_FILE" ]; then
  FINAL=$(cat "$USAGE_FILE")
  echo "📊 Final context usage: $(python3 -c "print(f'{float(\"$FINAL\")*100:.1f}')")%"
fi
echo "📝 Full log saved to $LOG_FILE"
echo ""
echo "▶️  Run ./run.sh again to start the next session"
