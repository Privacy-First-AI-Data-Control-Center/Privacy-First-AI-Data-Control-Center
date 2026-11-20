import type { NormalizedAgentEvent } from '../events/event.schema.js';
import type { QueueService } from '../queue/queue.service.js';
import { AgentAuthService } from './agent-auth.service.js';
/**
 * Canonical `/api/v1/agent/*` endpoints from Section 8.5 & Appendix A of the 41-page Master Guide.
 */
export declare const AGENT_API_PATHS: {
    readonly COMPLETE_ENROLLMENT: '/agent/enrollments/complete';
    readonly HEARTBEAT: '/agent/heartbeat';
    readonly CONFIG: '/agent/config';
    readonly DIAGNOSTICS: '/agent/diagnostics';
    readonly CONNECTORS: '/agent/connectors';
    readonly EVENTS_BATCH: '/agent/events/batch';
    readonly ACTIVE_POLICIES: '/agent/policies/active';
    readonly ENFORCEMENT_RESULTS: '/agent/enforcement-results';
};
export type EnforcementOutcomeStatus = 'succeeded' | 'failed' | 'unsupported' | 'not-attempted';
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
export declare class BackendClient {
    private readonly baseUrl;
    private readonly agentAuth;
    private readonly timeoutMs;
    private readonly fetchImpl;
    constructor(options: BackendClientOptions);
    /**
     * Member 1: `POST /api/v1/agent/enrollments/complete`
     * Exchanges a one-time enrollment token for a device-bound AgentCredential.
     */
    completeEnrollment(input: CompleteEnrollmentInput): Promise<BackendApiResponse<Record<string, unknown>>>;
    /**
     * Member 1: `POST /api/v1/agent/heartbeat`
     */
    sendHeartbeat(input: HeartbeatInput): Promise<BackendApiResponse<Record<string, unknown>>>;
    /**
     * Member 1: `GET /api/v1/agent/config`
     */
    fetchAgentConfig(): Promise<BackendApiResponse<Record<string, unknown>>>;
    /**
     * Member 1: `POST /api/v1/agent/diagnostics`
     */
    submitDiagnostics(diagnosticsPayload: Record<string, unknown>): Promise<BackendApiResponse<Record<string, unknown>>>;
    /**
     * Member 2: `GET /api/v1/agent/connectors`
     */
    fetchConnectorsConfig(): Promise<BackendApiResponse<Record<string, unknown>>>;
    /**
     * Member 2: `GET /api/v1/agent/policies/active`
     */
    fetchActivePolicies(): Promise<BackendApiResponse<Record<string, unknown>>>;
    /**
     * Member 2: `POST /api/v1/agent/events/batch`
     */
    submitEventsBatch(events: readonly NormalizedAgentEvent[]): Promise<BackendApiResponse<Record<string, unknown>>>;
    /**
     * Member 3: `POST /api/v1/agent/enforcement-results`
     * Reports whether a supported policy action actually succeeded, failed, or was unsupported at the connector hook.
     */
    reportEnforcementResult(report: EnforcementResultReportInput): Promise<BackendApiResponse<Record<string, unknown>>>;
    /**
     * Reads a ready batch of pending events from the local SQLite queue, submits them to
     * `POST /api/v1/agent/events/batch`, and either marks them `DELIVERED` or schedules
     * exponential-backoff retry on failure.
     */
    flushPendingQueueBatch(queueService: QueueService, batchLimit?: number): Promise<FlushQueueBatchResult>;
    private request;
}
