# Privacy-First AI Data Control Center — Local Monitoring Agent (`local-agent-claude-hook`)

Independent **Node.js + TypeScript + Fastify** local monitoring agent and **Claude Code native HTTP hook** receiver for the **Privacy-First AI Data Control Center**.

---

## 1. Architecture & Responsibilities

```text
Claude Code CLI (SessionStart / PreToolUse / PostToolUse / PostToolUseFailure / SessionEnd)
    │
    ▼  HTTP POST http://127.0.0.1:43127/hooks/claude-code (x-webhook-token)
Fastify Local Webhook Receiver (Loopback-only 127.0.0.1, Constant-Time Token Auth, Body Limit)
    │
    ▼
Claude Code Connector & Event Mapper (Metadata-First Extraction, Capability & Blind-Spot Declaration)
    │
    ▼
Sensitive-Data Redaction Engine (Masks API Keys, Tokens, Passwords, Private Keys, Emails BEFORE Disk)
    │
    ▼
Event Normalizer (Canonical Event Schema + Deterministic SHA-256 dedupeKey)
    │
    ▼
SQLite Persistent Queue (WAL Mode, Bounded Capacity, Exponential Backoff Retries)
    │
    ▼  Device-Bound AgentCredential Auth (/api/v1/agent/*)
NestJS Central Backend API -> PostgreSQL -> Next.js Privacy Dashboard
```

---

## 2. Directory Structure

```text
local-agent-claude-hook/
├── src/
│   ├── main.ts                                  # Bootstrap & graceful SIGINT/SIGTERM shutdown
│   ├── config/
│   │   ├── env.ts                               # Zod environment validation (enforces loopback HOST)
│   │   └── config.service.ts                    # Typed configuration service
│   ├── server/
│   │   ├── http-server.ts                       # Fastify instance factory & Pino log redaction
│   │   └── routes/
│   │       ├── health.route.ts                  # GET /health
│   │       └── claude-code.route.ts             # POST /hooks/claude-code
│   ├── connectors/
│   │   └── claude-code/
│   │       ├── event-mapper.ts                  # Maps Claude Code tools to metadata-first events
│   │       ├── connector.service.ts             # Capability & blind-spot declarations
│   │       └── hook-handler.ts                  # Zod hook validation & receipt handler
│   ├── events/
│   │   ├── event.schema.ts                      # Canonical NormalizedAgentEvent Zod schema
│   │   ├── event-normalizer.ts                  # SHA-256 dedupeKey & event envelope builder
│   │   └── event-processor.ts                   # Orchestrates Redaction -> Normalization -> Queue
│   ├── security/
│   │   ├── webhook-auth.ts                      # Constant-time SHA-256 timingSafeEqual webhook guard
│   │   └── redaction.service.ts                 # Secret & PII redaction before persistence
│   ├── queue/
│   │   ├── sqlite.repository.ts                 # Node 22 node:sqlite WAL persistent queue
│   │   └── queue.service.ts                     # Queue lifecycle, deduplication & retry management
│   ├── backend/
│   │   ├── agent-auth.service.ts                # Device-bound AgentCredential state (UNENROLLED/ENROLLED/REVOKED)
│   │   └── backend-client.ts                    # Client for all 8 /api/v1/agent/* backend routes
│   ├── health/
│   │   └── health.service.ts                    # Agent health & queue status reporting
│   └── diagnostics/
│       └── diagnostics.service.ts               # Sanitized runtime & error diagnostics
├── integrations/
│   └── claude-code/
│       ├── settings.example.json                # Claude Code native HTTP hook configuration
│       └── installer/
│           ├── privacy-first-ai-agent.service   # Linux systemd user unit
│           └── install-agent.sh                 # Installer helper script
├── tests/                                       # Automated Vitest unit, integration & E2E suites
├── .env.example
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

---

## 3. Quick Start

```bash
cd local-agent-claude-hook

# 1. Copy environment file and set your LOCAL_WEBHOOK_TOKEN
cp .env.example .env

# 2. Run in development watch mode
npm run dev

# 3. Run typecheck, unit/integration/E2E tests, and production build
npm run typecheck
npm test
npm run build
```

---

## 4. Connecting Claude Code Hooks

Copy the `hooks` configuration from [`integrations/claude-code/settings.example.json`](./integrations/claude-code/settings.example.json) into `~/.claude/settings.json` (or `.claude/settings.local.json`) and match the `x-webhook-token` header with `LOCAL_WEBHOOK_TOKEN` in your `.env`.
