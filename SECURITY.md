# Security & Privacy Policy

## Privacy-by-Design Guarantees

**Privacy-First AI Data Control Center** is engineered to protect sensitive source code, credentials, and personal data on developer workstations:

1. **Zero Raw File Egress:** Policy evaluation and secret redaction execute locally inside `local-agent/` before any telemetry is queued or transmitted. Raw file contents never leave the developer's machine.
2. **Fail-Safe Offline Queueing:** Telemetry records are stored locally in `node:sqlite` when offline and synced over HTTPS with redacted metadata only.
3. **Strict Credential Stripping:** Backend responses automatically strip sensitive fields (`passwordHash`, raw tokens) via global NestJS interceptors, and access is scoped by `JwtGuard`, `RolesGuard`, and `WorkspaceRoleGuard`.

---

## Supported Components

| Component | Path | Status |
| :--- | :--- | :--- |
| **Control Center Backend API** | `backend/` | Actively maintained |
| **Local Hook & Redaction Agent** | `local-agent/` | Actively maintained |
| **Web Control Center Dashboard** | `frontend/` | In active development |

---

## Reporting a Vulnerability

If you discover a security or privacy issue (such as a hook bypass, redaction miss, or RBAC privilege escalation):

1. **Do not** post live credentials, exploit payloads, or real `.env` secrets in public GitHub Issues.
2. Open a sanitized security report via private disclosure to the organization maintainers ([@shohagranasuvo](https://github.com/shohagranasuvo), [@ayanhalder27](https://github.com/ayanhalder27), [@ahnaftanvir21](https://github.com/ahnaftanvir21), [@munna89-ig](https://github.com/munna89-ig)) with:
   - Affected component (`backend`, `local-agent`, or `frontend`)
   - Steps to reproduce with synthetic/redacted test data
   - Expected vs. actual enforcement or access behavior
3. We aim to triage and respond within **48 hours**.
