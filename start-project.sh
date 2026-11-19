#!/usr/bin/env bash
set -euo pipefail

# One-command launcher for Privacy-First AI Data Control Center
# Usage:
#   ./start-project.sh                # Open 3 separate terminal windows (default)
#   ./start-project.sh --tabs         # Open as tabs in the current Ptyxis window
#   ./start-project.sh --setup-hooks  # Force re-running `npm run setup:hooks`

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
AGENT_DIR="${PROJECT_ROOT}/local-agent"
HOOK_SETTINGS="${AGENT_DIR}/.claude/settings.json"

USE_TABS=false
FORCE_SETUP_HOOKS=false

for arg in "$@"; do
  case "$arg" in
    --tabs)
      USE_TABS=true
      ;;
    --setup-hooks)
      FORCE_SETUP_HOOKS=true
      ;;
    -h|--help)
      echo "Usage: ./start-project.sh [--tabs] [--setup-hooks]"
      echo "  --tabs         Open Backend, Agent, and Monitor as tabs instead of separate windows"
      echo "  --setup-hooks  Force re-running npm run setup:hooks even if already connected"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (use --help for usage)"
      exit 1
      ;;
  esac
done

# 1. Verify folders exist
if [[ ! -d "${BACKEND_DIR}" || ! -d "${AGENT_DIR}" ]]; then
  echo "[ERROR] Expected 'backend/' and 'local-agent/' inside ${PROJECT_ROOT}"
  exit 1
fi

# 2. Auto-connect Claude Code hooks if not connected (or if --setup-hooks passed)
if [[ "${FORCE_SETUP_HOOKS}" == true ]] || [[ ! -f "${HOOK_SETTINGS}" ]] || ! grep -q "hooks/claude-code" "${HOOK_SETTINGS}" 2>/dev/null; then
  echo "[SETUP] Claude Code hook not connected (or --setup-hooks requested). Running npm run setup:hooks..."
  (cd "${AGENT_DIR}" && npm run setup:hooks)
else
  echo "[OK] Claude Code hooks already connected (${HOOK_SETTINGS})."
fi

# 3. Read agent port from .env (default 43127)
AGENT_PORT="$(grep -E '^PORT=' "${AGENT_DIR}/.env" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)"
AGENT_PORT="${AGENT_PORT:-43127}"

# Helper to open a new terminal window/tab across common Linux terminals
open_terminal() {
  local title="$1"
  local workdir="$2"
  local cmd="$3"
  local wrapped_cmd="echo '=== ${title} ==='; ${cmd}; echo ''; echo '[Process exited. Press Ctrl+D or close window]'; exec bash"

  if command -v ptyxis >/dev/null 2>&1; then
    if [[ "${USE_TABS}" == true ]]; then
      ptyxis --tab -T "${title}" -d "${workdir}" -- bash -lc "${wrapped_cmd}" >/dev/null 2>&1 &
    else
      ptyxis --new-window -T "${title}" -d "${workdir}" -- bash -lc "${wrapped_cmd}" >/dev/null 2>&1 &
    fi
  elif command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal --title="${title}" --working-directory="${workdir}" -- bash -lc "${wrapped_cmd}" >/dev/null 2>&1 &
  elif command -v kgx >/dev/null 2>&1; then
    kgx --title="${title}" --working-directory="${workdir}" -- bash -lc "${wrapped_cmd}" >/dev/null 2>&1 &
  elif command -v konsole >/dev/null 2>&1; then
    konsole --new-tab --workdir "${workdir}" -p tabtitle="${title}" -e bash -lc "${wrapped_cmd}" >/dev/null 2>&1 &
  elif command -v xfce4-terminal >/dev/null 2>&1; then
    xfce4-terminal --title="${title}" --working-directory="${workdir}" -e "bash -lc \"${wrapped_cmd}\"" >/dev/null 2>&1 &
  elif command -v kitty >/dev/null 2>&1; then
    kitty --title "${title}" --directory "${workdir}" bash -lc "${wrapped_cmd}" >/dev/null 2>&1 &
  elif command -v alacritty >/dev/null 2>&1; then
    alacritty --title "${title}" --working-directory "${workdir}" -e bash -lc "${wrapped_cmd}" >/dev/null 2>&1 &
  elif command -v xterm >/dev/null 2>&1; then
    xterm -T "${title}" -e bash -lc "cd \"${workdir}\" && ${wrapped_cmd}" >/dev/null 2>&1 &
  else
    echo "[ERROR] No supported terminal emulator found (ptyxis, gnome-terminal, konsole, xfce4-terminal, kitty, alacritty, xterm)."
    exit 1
  fi
}

# 4. Terminal 1: NestJS Backend (with 4 GB heap to prevent OOM)
BACKEND_CMD='export NODE_OPTIONS="--max-old-space-size=4096"
if [ ! -d node_modules ]; then npm install; fi
npm run start:dev'

# 5. Terminal 2: Local Agent / Claude Code Hook Daemon
AGENT_CMD='if [ ! -d node_modules ]; then npm install; fi
if [ ! -f dist/main.js ]; then npm run build; fi
node dist/main.js'

# 6. Terminal 3: Live Status & Interactive Console
MONITOR_CMD="echo 'Waiting for Backend (http://localhost:3000) and Local Agent (http://127.0.0.1:${AGENT_PORT})...'
for i in \$(seq 1 45); do
  if curl -s -o /dev/null http://localhost:3000/api/v1/connectors; then
    echo '[READY] Backend API is UP -> http://localhost:3000/api/v1'
    echo '[READY] Swagger Docs      -> http://localhost:3000/api'
    break
  fi
  sleep 1
done
echo ''
echo 'Useful commands in this terminal:'
echo '  curl http://localhost:3000/api/v1/connectors'
echo '  curl http://localhost:3000/api/v1/agent/connectors'
echo '  (cd local-agent && npm run db:view)'"

echo "[LAUNCH] Opening Terminal 1: Backend API (NestJS)"
open_terminal "1. Backend API (NestJS)" "${BACKEND_DIR}" "${BACKEND_CMD}"
sleep 0.5

echo "[LAUNCH] Opening Terminal 2: Local Agent (All AI Tools)"
open_terminal "2. Local Agent (All AI Tools)" "${AGENT_DIR}" "${AGENT_CMD}"
sleep 0.5

echo "[LAUNCH] Opening Terminal 3: Status & Console"
open_terminal "3. Status & Console" "${PROJECT_ROOT}" "${MONITOR_CMD}"

echo "[DONE] All 3 terminals launched!"
