#!/usr/bin/env bash
# new-project.sh - scaffold a new project and launch the local GUI against it
# usage:
#   ./new-project.sh <project-name>              creates ~/projects/<name>
#   ./new-project.sh <project-name> <directory>  creates <directory>/<name>
#
# What it does:
#   1. Creates the project folder
#   2. Writes a CLAUDE.md template so the agent has instant context
#   3. Opens the local claw-code-gui pointed at that folder
#   4. Browser auto-opens at localhost:8765

set -u

PROJECT_NAME="${1:-}"
BASE_DIR="${2:-$HOME/projects}"

# Prompt if name not given
if [ -z "$PROJECT_NAME" ]; then
  printf "project name: "
  read -r PROJECT_NAME
fi

[ -z "$PROJECT_NAME" ] && { echo "error: project name required"; exit 1; }

PROJECT_DIR="$BASE_DIR/$PROJECT_NAME"

if [ -d "$PROJECT_DIR" ]; then
  echo "directory already exists: $PROJECT_DIR"
  printf "open it anyway? (y/n) "
  read -r CONFIRM
  [ "$CONFIRM" != "y" ] && exit 0
else
  mkdir -p "$PROJECT_DIR"
  echo "created: $PROJECT_DIR"

  # Write CLAUDE.md template
  cat > "$PROJECT_DIR/CLAUDE.md" << TEMPLATE
# Project: $PROJECT_NAME

## Overview
[Describe what this project does and its main purpose]

## Tech stack
[Languages, frameworks, key dependencies]

## Key conventions
[Coding style, naming conventions, important patterns to follow]

## Build & run
\`\`\`bash
# build:
# run:
# test:
\`\`\`

## Notes for the AI agent
[Anything the agent should know: gotchas, off-limits files, test data locations]
TEMPLATE

  echo "created: $PROJECT_DIR/CLAUDE.md"
  echo "(edit CLAUDE.md to give the agent context about this project)"
fi

echo

# Source env vars (model, base URL, PATH for venv)
# shellcheck disable=SC1090
source "$HOME/.claw-code-agent.env" 2>/dev/null || {
  echo "warning: ~/.claw-code-agent.env not found — OPENAI_* vars may not be set"
}

PORT="${PORT:-8765}"
URL="http://localhost:$PORT"

echo "=== starting local GUI ==="
echo "  project: $PROJECT_DIR"
echo "  model:   ${OPENAI_MODEL:-qwen3-coder:30b}"
echo "  url:     $URL"
echo "  (Ctrl-C to stop)"
echo

# Open browser after 3s
(
  sleep 3
  if command -v cmd >/dev/null 2>&1; then
    cmd //c start "" "$URL" >/dev/null 2>&1 || echo "Open $URL in your browser"
  else
    echo "Open $URL in your browser"
  fi
) &
OPENER_PID=$!

trap 'kill "$OPENER_PID" 2>/dev/null; exit' INT TERM

exec claw-code-gui \
  --host 127.0.0.1 --port "$PORT" --no-browser \
  --cwd "$PROJECT_DIR" \
  --allow-write --allow-shell
