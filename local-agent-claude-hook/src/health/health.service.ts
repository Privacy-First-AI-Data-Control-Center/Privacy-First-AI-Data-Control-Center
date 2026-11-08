import type { QueueStats } from '../queue/sqlite.repository.js';
import type { AgentEnrollmentState } from '../backend/agent-auth.service.js';

export interface HealthStatusPayload {
  status: 'ok' | 'degraded';
  service: 'local-agent-claude-hook';
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  enrollmentState?: AgentEnrollmentState;
  queue?: QueueStats;
}

export interface HealthServiceOptions {
  version?: string;
  getQueueStats?: () => QueueStats;
  getEnrollmentState?: () => AgentEnrollmentState;
}

export class HealthService {
  private readonly serviceName = 'local-agent-claude-hook' as const;
  private readonly version: string;
  private readonly getQueueStats?: () => QueueStats;
  private readonly getEnrollmentState?: () => AgentEnrollmentState;

  constructor(options: string | HealthServiceOptions = '1.0.0') {
    if (typeof options === 'string') {
      this.version = options;
    } else {
      this.version = options.version ?? '1.0.0';
      this.getQueueStats = options.getQueueStats;
      this.getEnrollmentState = options.getEnrollmentState;
    }
  }

  public getHealthStatus(): HealthStatusPayload {
    const enrollmentState = this.getEnrollmentState?.();
    const queue = this.getQueueStats?.();
    const isDegraded =
      enrollmentState === 'REVOKED' || (queue !== undefined && queue.failedCount > 0);

    return {
      status: isDegraded ? 'degraded' : 'ok',
      service: this.serviceName,
      version: this.version,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      ...(enrollmentState ? { enrollmentState } : {}),
      ...(queue ? { queue } : {}),
    };
  }
}
