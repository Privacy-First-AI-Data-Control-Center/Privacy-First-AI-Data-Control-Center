import type { NormalizedAgentEvent } from '../events/event.schema.js';
import type { QueueService } from '../queue/queue.service.js';
import { AgentAuthService } from './agent-auth.service.js';

/**
 * Canonical `/api/v1/agent/*` endpoints from Section 8.5 & Appendix A of the 41-page Master Guide.
 */
export const AGENT_API_PATHS = {
  // Member 1 — Identity, Workspace & Device Foundation
  COMPLETE_ENROLLMENT: '/agent/enrollments/complete',
  HEARTBEAT: '/agent/heartbeat',
  CONFIG: '/agent/config',
  DIAGNOSTICS: '/agent/diagnostics',

  // Member 2 — Connectors, Integrations & Event Collection
  CONNECTORS: '/agent/connectors',
  EVENTS_BATCH: '/agent/events/batch',
  ACTIVE_POLICIES: '/agent/policies/active',

  // Member 3 — Privacy Detection, Policies, Enforcement & Risk
  ENFORCEMENT_RESULTS: '/agent/enforcement-results',
} as const;

export type EnforcementOutcomeStatus =
  | 'succeeded'
  | 'failed'
  | 'unsupported'
  | 'not-attempted';

export interface CompleteEnrollmentInput {
  enrollmentToken: string;
  deviceName: string;
  agentVersion: string;
  installationId: string;
}

export interface HeartbeatInput {
  agentVersion: string;
  status: 'online' | 'degraded';
  uptimeSeconds: number;
  pendingQueueCount: number;
  observedAt: string;
}

export interface EnforcementResultReportInput {
  policyDecisionId?: string;
  eventId: string;
  actionType: 'allow' | 'warn' | 'redact' | 'block';
  outcome: EnforcementOutcomeStatus;
  evidence: Record<string, unknown>;
  performedAt: string;
}

export interface BackendApiResponse<T = unknown> {
  ok: boolean;
  statusCode: number;
  data: T | null;
  errorMessage: string | null;
  retryable: boolean;
  credentialRevoked: boolean;
}

export interface FlushQueueBatchResult {
  attemptedCount: number;
  deliveredCount: number;
  failedCount: number;
  skippedUnenrolled: boolean;
  credentialRevoked: boolean;
}

export interface BackendClientOptions {
  baseUrl: string;
  agentAuthService: AgentAuthService;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * HTTP client for communicating with the NestJS backend (`/api/v1/agent/*`).
 * Coordinates across Member 1, Member 2, and Member 3 agent endpoints without
 * hardcoding unagreed backend-internal database schemas.
 */
export class BackendClient {
  private readonly baseUrl: string;
  private readonly agentAuth: AgentAuthService;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: BackendClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.agentAuth = options.agentAuthService;
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
  }

  /**
   * Member 1: `POST /api/v1/agent/enrollments/complete`
   * Exchanges a one-time enrollment token for a device-bound AgentCredential.
   */
  public async completeEnrollment(
    input: CompleteEnrollmentInput,
  ): Promise<BackendApiResponse<Record<string, unknown>>> {
    const identity = this.agentAuth.getIdentityContext();

    const response = await this.request<Record<string, unknown>>({
      method: 'POST',
      path: AGENT_API_PATHS.COMPLETE_ENROLLMENT,
      requiresAgentCredential: false,
      body: {
        enrollmentToken: input.enrollmentToken,
        deviceName: input.deviceName,
        agentVersion: input.agentVersion,
        installationId: input.installationId,
        platform: identity.platform,
        osVersion: identity.osVersion,
        hostnameHash: identity.hostnameHash,
      },
    });

    if (response.ok && response.data) {
      const issuedDeviceId =
        typeof response.data.deviceId === 'string' ? response.data.deviceId : null;
      const issuedToken =
        typeof response.data.agentCredential === 'string'
          ? response.data.agentCredential
          : typeof response.data.credentialToken === 'string'
            ? response.data.credentialToken
            : typeof response.data.token === 'string'
              ? response.data.token
              : null;

      if (issuedDeviceId && issuedToken) {
        this.agentAuth.setEnrolledCredentials({
          deviceId: issuedDeviceId,
          credentialToken: issuedToken,
        });
      }
    }

    return response;
  }

  /**
   * Member 1: `POST /api/v1/agent/heartbeat`
   */
  public async sendHeartbeat(
    input: HeartbeatInput,
  ): Promise<BackendApiResponse<Record<string, unknown>>> {
    return this.request<Record<string, unknown>>({
      method: 'POST',
      path: AGENT_API_PATHS.HEARTBEAT,
      requiresAgentCredential: true,
      body: {
        deviceId: this.agentAuth.getDeviceId(),
        ...input,
      },
    });
  }

  /**
   * Member 1: `GET /api/v1/agent/config`
   */
  public async fetchAgentConfig(): Promise<
    BackendApiResponse<Record<string, unknown>>
  > {
    return this.request<Record<string, unknown>>({
      method: 'GET',
      path: AGENT_API_PATHS.CONFIG,
      requiresAgentCredential: true,
    });
  }

  /**
   * Member 1: `POST /api/v1/agent/diagnostics`
   */
  public async submitDiagnostics(
    diagnosticsPayload: Record<string, unknown>,
  ): Promise<BackendApiResponse<Record<string, unknown>>> {
    return this.request<Record<string, unknown>>({
      method: 'POST',
      path: AGENT_API_PATHS.DIAGNOSTICS,
      requiresAgentCredential: true,
      body: {
        deviceId: this.agentAuth.getDeviceId(),
        reportedAt: new Date().toISOString(),
        diagnostics: diagnosticsPayload,
      },
    });
  }

  /**
   * Member 2: `GET /api/v1/agent/connectors`
   */
  public async fetchConnectorsConfig(): Promise<
    BackendApiResponse<Record<string, unknown>>
  > {
    return this.request<Record<string, unknown>>({
      method: 'GET',
      path: AGENT_API_PATHS.CONNECTORS,
      requiresAgentCredential: true,
    });
  }

  /**
   * Member 2: `GET /api/v1/agent/policies/active`
   */
  public async fetchActivePolicies(): Promise<
    BackendApiResponse<Record<string, unknown>>
  > {
    return this.request<Record<string, unknown>>({
      method: 'GET',
      path: AGENT_API_PATHS.ACTIVE_POLICIES,
      requiresAgentCredential: true,
    });
  }

  /**
   * Member 2: `POST /api/v1/agent/events/batch`
   */
  public async submitEventsBatch(
    events: readonly NormalizedAgentEvent[],
  ): Promise<BackendApiResponse<Record<string, unknown>>> {
    return this.request<Record<string, unknown>>({
      method: 'POST',
      path: AGENT_API_PATHS.EVENTS_BATCH,
      requiresAgentCredential: true,
      body: {
        deviceId: this.agentAuth.getDeviceId(),
        sentAt: new Date().toISOString(),
        events,
      },
    });
  }

  /**
   * Member 3: `POST /api/v1/agent/enforcement-results`
   * Reports whether a supported policy action actually succeeded, failed, or was unsupported at the connector hook.
   */
  public async reportEnforcementResult(
    report: EnforcementResultReportInput,
  ): Promise<BackendApiResponse<Record<string, unknown>>> {
    return this.request<Record<string, unknown>>({
      method: 'POST',
      path: AGENT_API_PATHS.ENFORCEMENT_RESULTS,
      requiresAgentCredential: true,
      body: {
        deviceId: this.agentAuth.getDeviceId(),
        ...report,
      },
    });
  }

  /**
   * Reads a ready batch of pending events from the local SQLite queue, submits them to
   * `POST /api/v1/agent/events/batch`, and either marks them `DELIVERED` or schedules
   * exponential-backoff retry on failure.
   */
  public async flushPendingQueueBatch(
    queueService: QueueService,
    batchLimit = 50,
  ): Promise<FlushQueueBatchResult> {
    if (!this.agentAuth.isAuthenticated()) {
      return {
        attemptedCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        skippedUnenrolled: true,
        credentialRevoked: this.agentAuth.isRevoked(),
      };
    }

    const readyItems = queueService.getReadyEvents(batchLimit);
    if (readyItems.length === 0) {
      return {
        attemptedCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        skippedUnenrolled: false,
        credentialRevoked: false,
      };
    }

    const events = readyItems.map((item) => item.event);
    const eventIds = readyItems.map((item) => item.row.eventId);

    const response = await this.submitEventsBatch(events);

    if (response.ok) {
      const deliveredCount = queueService.acknowledgeDelivered(eventIds);
      return {
        attemptedCount: events.length,
        deliveredCount,
        failedCount: 0,
        skippedUnenrolled: false,
        credentialRevoked: false,
      };
    }

    const errorReason =
      response.errorMessage ?? `Backend HTTP ${response.statusCode}`;
    for (const id of eventIds) {
      queueService.recordSubmissionFailure(id, errorReason);
    }

    return {
      attemptedCount: events.length,
      deliveredCount: 0,
      failedCount: events.length,
      skippedUnenrolled: false,
      credentialRevoked: response.credentialRevoked,
    };
  }

  private async request<T>(params: {
    method: 'GET' | 'POST';
    path: string;
    requiresAgentCredential: boolean;
    body?: unknown;
  }): Promise<BackendApiResponse<T>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (params.requiresAgentCredential) {
      try {
        Object.assign(headers, this.agentAuth.getAuthHeaders());
      } catch (error) {
        return {
          ok: false,
          statusCode: 0,
          data: null,
          errorMessage:
            error instanceof Error ? error.message : 'Agent authentication unavailable',
          retryable: false,
          credentialRevoked: this.agentAuth.isRevoked(),
        };
      }
    }

    if (params.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${params.path}`, {
        method: params.method,
        headers,
        body: params.body !== undefined ? JSON.stringify(params.body) : undefined,
        signal: controller.signal,
      });

      let parsedData: T | null = null;
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          parsedData = (await response.json()) as T;
        } catch {
          parsedData = null;
        }
      }

      if (response.ok) {
        return {
          ok: true,
          statusCode: response.status,
          data: parsedData,
          errorMessage: null,
          retryable: false,
          credentialRevoked: false,
        };
      }

      const credentialRevoked =
        params.requiresAgentCredential &&
        (response.status === 401 || response.status === 403);

      if (credentialRevoked) {
        this.agentAuth.markCredentialRevoked();
      }

      const retryable =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;

      return {
        ok: false,
        statusCode: response.status,
        data: parsedData,
        errorMessage: `Backend request failed with HTTP ${response.status}`,
        retryable,
        credentialRevoked,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Network error contacting backend';
      return {
        ok: false,
        statusCode: 0,
        data: null,
        errorMessage: message,
        retryable: true,
        credentialRevoked: false,
      };
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
