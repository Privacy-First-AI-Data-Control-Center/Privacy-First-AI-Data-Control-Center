import type { QueueStats } from '../queue/sqlite.repository.js';
import type { AgentEnrollmentState } from '../backend/agent-auth.service.js';
export interface HealthStatusPayload {
    status: 'ok' | 'degraded';
    service: 'local-agent';
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
export declare class HealthService {
    private readonly serviceName;
    private readonly version;
    private readonly getQueueStats?;
    private readonly getEnrollmentState?;
    constructor(options?: string | HealthServiceOptions);
    getHealthStatus(): HealthStatusPayload;
}
