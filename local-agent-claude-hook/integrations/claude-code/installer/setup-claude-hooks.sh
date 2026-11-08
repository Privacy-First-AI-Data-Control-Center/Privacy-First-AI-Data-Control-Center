#!/usr/bin/env bash
set -euo pipefail

# Setup Claude Code HTTP Hooks for Privacy-First AI Local Agent
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
TARGET_Project_CLAUDE_DIR="${AGENT_ROOT}/.claude"

if [[ ! -f "${AGENT_ROOT}/.env" ]]; then
  cp "${AGENT_ROOT}/.env.example" "${AGENT_ROOT}/.env"
  echo "[1/3] Created ${AGENT_ROOT}/.env from .env.example"
fi

# Read LOCAL_WEBHOOK_TOKEN and PORT from .env (or fall back to defaults)
WEBHOOK_TOKEN="$(grep -E '^LOCAL_WEBHOOK_TOKEN=' "${AGENT_ROOT}/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)"
PORT="$(grep -E '^PORT=' "${AGENT_ROOT}/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)"

WEBHOOK_TOKEN="${WEBHOOK_TOKEN:-replace-with-secure-local-webhook-token-min-16-chars}"
PORT="${PORT:-43127}"
HOOK_URL="http://127.0.0.1:${PORT}/hooks/claude-code"

mkdir -p "${TARGET_Project_CLAUDE_DIR}"

cat <<EOF > "${TARGET_Project_CLAUDE_DIR}/settings.json"
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "http",
            "url": "${HOOK_URL}",
            "headers": {
              "x-webhook-token": "${WEBHOOK_TOKEN}"
            },
            "timeout": 5
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "http",
            "url": "${HOOK_URL}",
            "headers": {
              "x-webhook-token": "${WEBHOOK_TOKEN}"
            },
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "http",
            "url": "${HOOK_URL}",
            "headers": {
              "x-webhook-token": "${WEBHOOK_TOKEN}"
            },
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "http",
            "url": "${HOOK_URL}",
            "headers": {
              "x-webhook-token": "${WEBHOOK_TOKEN}"
            },
            "timeout": 5
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "http",
            "url": "${HOOK_URL}",
            "headers": {
              "x-webhook-token": "${WEBHOOK_TOKEN}"
            },
            "timeout": 5
          }
        ]
      }
    ]
  }
}
EOF

echo "[2/3] Generated ${TARGET_Project_CLAUDE_DIR}/settings.json pointing to ${HOOK_URL}"
echo "[3/3] Claude Code hooks are now active inside ${AGENT_ROOT}!"
