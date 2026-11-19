#!/usr/bin/env bash
set -euo pipefail

# Privacy-First AI Data Control Center — Claude Code Hook & Systemd User Service Helper
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
SYSTEMD_USER_DIR="${HOME}/.config/systemd/user"
SERVICE_NAME="privacy-first-ai-agent.service"

echo "=== Privacy-First AI Local Agent Installer Helper ==="
echo "Agent root directory: ${AGENT_ROOT}"

if [[ ! -f "${AGENT_ROOT}/.env" ]]; then
  cp "${AGENT_ROOT}/.env.example" "${AGENT_ROOT}/.env"
  echo "[1/3] Created ${AGENT_ROOT}/.env from .env.example (remember to set a unique LOCAL_WEBHOOK_TOKEN)."
else
  echo "[1/3] Existing ${AGENT_ROOT}/.env found."
fi

mkdir -p "${SYSTEMD_USER_DIR}"

sed \
  -e "s|WorkingDirectory=.*|WorkingDirectory=${AGENT_ROOT}|g" \
  -e "s|EnvironmentFile=.*|EnvironmentFile=${AGENT_ROOT}/.env|g" \
  "${SCRIPT_DIR}/${SERVICE_NAME}" > "${SYSTEMD_USER_DIR}/${SERVICE_NAME}"

echo "[2/3] Installed systemd user unit to ${SYSTEMD_USER_DIR}/${SERVICE_NAME}"
echo "[3/3] To build, enable, and start the background service on Linux, run:"
echo "  cd \"${AGENT_ROOT}\" && npm run build"
echo "  systemctl --user daemon-reload"
echo "  systemctl --user enable --now ${SERVICE_NAME}"
echo "  systemctl --user status ${SERVICE_NAME}"
