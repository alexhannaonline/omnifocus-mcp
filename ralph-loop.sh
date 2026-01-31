#!/bin/bash
# Ralph Wiggum Loop — autonomous implementation with fresh sessions
#
# Usage: ./ralph-loop.sh [max_iterations]
#
# Each iteration:
#   1. Starts a fresh Claude Code session with the ralph prompt
#   2. Claude checks git state, picks up where the last session left off
#   3. Implements what it can, builds, tests, commits
#   4. If the LAST LINE of output contains the completion promise → done
#   5. Otherwise → next iteration
#
# Safety: max iterations cap, budget cap per iteration

set -euo pipefail

WORK_DIR="/Users/alexhanna/Coding_Projects/omnifocus-mcp"
PROMPT_FILE="$WORK_DIR/planning/ralph-prompt.md"
LOG_DIR="$WORK_DIR/.ralph-logs"
MAX_ITERATIONS="${1:-20}"
COMPLETION_PROMISE="ALL TOOLS IMPLEMENTED AND TESTS PASSING"
BUDGET_PER_ITERATION="50.00"  # generous cap — Max plan, no API budget concern

# Create log directory
mkdir -p "$LOG_DIR"

echo "=== Ralph Wiggum Loop ==="
echo "Working directory: $WORK_DIR"
echo "Max iterations: $MAX_ITERATIONS"
echo "Budget per iteration: \$$BUDGET_PER_ITERATION"
echo "Completion promise: $COMPLETION_PROMISE"
echo ""

# Read the prompt
if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: Prompt file not found: $PROMPT_FILE"
  exit 1
fi

PROMPT=$(cat "$PROMPT_FILE")

for i in $(seq 1 "$MAX_ITERATIONS"); do
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  LOG_FILE="$LOG_DIR/iteration-${i}-${TIMESTAMP}.log"

  echo "--- Iteration $i of $MAX_ITERATIONS ---"
  echo "Log: $LOG_FILE"
  echo "Started: $(date)"

  # Show git state going in
  echo ""
  echo "Git state:"
  cd "$WORK_DIR" && git log --oneline -5
  echo ""

  # Run Claude in print mode
  # --dangerously-skip-permissions: fully unattended, no prompts
  # --model: explicit model selection
  # --max-budget-usd: cap spending per iteration
  OUTPUT=$(cd "$WORK_DIR" && claude -p \
    --dangerously-skip-permissions \
    --model sonnet \
    --max-budget-usd "$BUDGET_PER_ITERATION" \
    "$PROMPT" \
    2>&1 | tee "$LOG_FILE") || true

  echo ""
  echo "Finished: $(date)"

  # Check for completion promise in the LAST 20 lines only
  # (avoids false positives from Claude quoting the prompt or discussing the promise)
  TAIL_OUTPUT=$(echo "$OUTPUT" | tail -20)
  if echo "$TAIL_OUTPUT" | grep -qF "$COMPLETION_PROMISE"; then
    echo ""
    echo "=== COMPLETION PROMISE FOUND ==="
    echo "Ralph loop completed in $i iteration(s)."
    echo ""
    echo "Final git state:"
    cd "$WORK_DIR" && git log --oneline -10
    echo ""
    echo "Final test results:"
    cd "$WORK_DIR" && npm test 2>&1 | tail -5
    exit 0
  fi

  echo "No completion promise found. Continuing to next iteration..."
  echo ""

  # Brief pause between iterations
  sleep 2
done

echo ""
echo "=== MAX ITERATIONS REACHED ($MAX_ITERATIONS) ==="
echo "Ralph loop did not complete. Check logs in $LOG_DIR"
echo ""
echo "Final git state:"
cd "$WORK_DIR" && git log --oneline -10
echo ""
echo "Final test results:"
cd "$WORK_DIR" && npm test 2>&1 | tail -5
exit 1
