# Privacy-First AI Data Control Center

Backend REST API and local hook agent for monitoring and enforcing privacy rules on local AI coding tools (Antigravity, Claude Code, Cursor, and Gemini CLI).

Built with NestJS, TypeORM, PostgreSQL (Supabase), and Fastify for **CSC4161 — Advance Programming in Web Technology**.

## Live Deployment

- **API Base URL:** `https://dynamic-enchantment-production-a30c714b.up.railway.app/api/v1`
- **Swagger UI:** `https://dynamic-enchantment-production-a30c714b.up.railway.app/api`

## Repository Layout

```text
.
├── backend/          # NestJS REST API (140 routes, 29 TypeORM entities)
├── local-agent/      # Local Fastify daemon + SQLite offline queue + policy blocker
└── start-project.sh  # Linux helper script to launch backend and local agent together
```

## Core Features

- **Authentication & RBAC:** JWT login/register (`bcrypt`), refresh tokens, session logout, and 4-role access control (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) enforced via `JwtGuard`, `RolesGuard`, and `WorkspaceRoleGuard`.
- **Workspaces & Devices:** Multi-workspace management, member role assignment, device enrollment, credential revocation, and agent heartbeat tracking.
- **Connectors & Integrations:** Seeded AI connector catalog (`claude-code`, `antigravity`, `cursor`), workspace integration CRUD using a manual TypeORM `QueryRunner` transaction (atomic writes across `integrations`, `integration_capabilities`, and `audit-logs`), and duplicate conflict checks (`409`).
- **Real-Time Policy Blocking (`local-agent`):** Syncs active policies from the backend every 15 seconds and evaluates `PreToolUse` hooks locally in under 5ms to block access to protected secret files or forbidden shell commands before execution.
- **Risk, Findings & Enforcement:** Policy versioning, dry-run policy simulator, sensitive-data findings, risk scoring, policy decisions, and enforcement action logs.
- **Governance & Reporting:** Workspace dashboard (6 endpoints), security alerts lifecycle, audit logs, data retention schedules, exports, deletion requests, `@Cron` JSON/CSV report generator, monitoring coverage, and global workspace search.
- **Cross-Cutting Concerns:** Global `ValidationPipe`, `AllExceptionsFilter` (consistent error format + `409` handling), `RequestLoggerMiddleware` (`X-Request-Id`), `ResponseInterceptor` (`X-Response-Time` + strips `passwordHash`), and `@CurrentUser()` custom decorator.

## Prerequisites

- Node.js 20+ (tested on Node 22 / 24)
- PostgreSQL database (or Supabase connection URL)

## Running Locally

### 1. Backend (`backend/`)

```bash
cd backend
npm install
```

Create a local environment config file in `backend/` with your database and mail settings:

```ini
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres
PORT=3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
GOOGLE_REFRESH_TOKEN=...
```

Start the server (4 GB Node heap is recommended for TypeScript compilation):

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run start:dev
```

Once running, open Swagger at `http://localhost:3000/api`.

### 2. Local Agent (`local-agent/`)

```bash
cd local-agent
npm install
npm run build
npm run setup:hooks
npm start
```

Configure `BACKEND_BASE_URL` (local or Railway URL), `AGENT_DEVICE_ID`, and optionally `AGENT_WORKSPACE_ID` in `local-agent/` config before starting.

To run the local agent unit and pipeline tests (37 tests):

```bash
cd local-agent
npm test
```

### 3. Quick Start Script (Linux)

From the repository root:

```bash
./start-project.sh
```

## Team

- **Ayan Halder** — Auth, Users, Workspaces, Workspace Members, Devices, Agent Lifecycle
- **Shohag Rana** — Events & Telemetry, Connectors, Integrations (`QueryRunner` tx), Agent Sync, Local Agent & Policy Blocker, Reports (`@Cron`), Monitoring Coverage & Search, Middleware/Interceptors/Exception Filter, Railway Deployment
- **Ahnaf Tanvir** — Policies, Policy Versions & Rules, Sensitive Data Types, Findings, Risk Rules & Findings, Policy Decisions, Enforcement Actions
- **Munna** — Dashboard, Alerts, Audit Logs, Retention, Exports, Deletion Requests, Health
