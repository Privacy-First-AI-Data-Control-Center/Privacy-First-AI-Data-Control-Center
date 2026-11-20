import type { AgentAuthService, AgentEnrollmentState } from '../backend/agent-auth.service.js';
import type { QueueService } from '../queue/queue.service.js';
import type { QueueStats } from '../queue/sqlite.repository.js';
import { RedactionService } from '../security/redaction.service.js';
export interface DiagnosticErrorEntry {
    code: string;
    message: string;
    occurredAt: string;
}
export interface AgentDiagnosticsSnapshot {
    capturedAt: string;
    agentVersion: string;
    runtime: {
        nodeVersion: string;
        platform: string;
        osRelease: string;
        uptimeSeconds: number;
        memoryRssBytes: number;
        memoryHeapUsedBytes: number;
    };
    enrollment: {
        deviceId: string;
        state: AgentEnrollmentState;
        isAuthenticated: boolean;
        isRevoked: boolean;
    };
    queue: QueueStats;
    recentErrors: readonly DiagnosticErrorEntry[];
}
export interface DiagnosticsServiceOptions {
    agentVersion?: string;
    agentAuthService: AgentAuthService;
    queueService: QueueService;
    redactionService?: RedactionService;
    maxRecentErrors?: number;
}
/**
 * Collects sanitized operational diagnostics and runtime telemetry for
 * local health inspection and `POST /api/v1/agent/diagnostics`.
 */
export declare class DiagnosticsService {
    private readonly agentVersion;
    private readonly agentAuthService;
    private readonly queueService;
    private readonly redactionService;
    private readonly maxRecentErrors;
    private readonly recentErrors;
    constructor(options: DiagnosticsServiceOptions);
    recordOperationalError(code: string, rawMessage: string): void;
    getSnapshot(): AgentDiagnosticsSnapshot;
}
