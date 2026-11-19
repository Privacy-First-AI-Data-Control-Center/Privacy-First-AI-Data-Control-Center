import { platform, release } from 'node:os';
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
export class DiagnosticsService {
  private readonly agentVersion: string;
  private readonly agentAuthService: AgentAuthService;
  private readonly queueService: QueueService;
  private readonly redactionService: RedactionService;
  private readonly maxRecentErrors: number;
  private readonly recentErrors: DiagnosticErrorEntry[] = [];

  constructor(options: DiagnosticsServiceOptions) {
    this.agentVersion = options.agentVersion ?? '1.0.0';
    this.agentAuthService = options.agentAuthService;
    this.queueService = options.queueService;
    this.redactionService = options.redactionService ?? new RedactionService();
    this.maxRecentErrors = options.maxRecentErrors ?? 25;
  }

  public recordOperationalError(code: string, rawMessage: string): void {
    const sanitizedMessage = this.redactionService.redactString(rawMessage).data;
    this.recentErrors.push({
      code,
      message: sanitizedMessage,
      occurredAt: new Date().toISOString(),
    });

    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors.shift();
    }
  }

  public getSnapshot(): AgentDiagnosticsSnapshot {
    const mem = process.memoryUsage();
    const identity = this.agentAuthService.getIdentityContext();
    const queueStats = this.queueService.getStats();

    return {
      capturedAt: new Date().toISOString(),
      agentVersion: this.agentVersion,
      runtime: {
        nodeVersion: process.version,
        platform: platform(),
        osRelease: release(),
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssBytes: mem.rss,
        memoryHeapUsedBytes: mem.heapUsed,
      },
      enrollment: {
        deviceId: identity.deviceId,
        state: identity.enrollmentState,
        isAuthenticated: this.agentAuthService.isAuthenticated(),
        isRevoked: this.agentAuthService.isRevoked(),
      },
      queue: queueStats,
      recentErrors: [...this.recentErrors],
    };
  }
}
