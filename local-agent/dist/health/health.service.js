export class HealthService {
    serviceName = 'local-agent';
    version;
    getQueueStats;
    getEnrollmentState;
    constructor(options = '1.0.0') {
        if (typeof options === 'string') {
            this.version = options;
        }
        else {
            this.version = options.version ?? '1.0.0';
            this.getQueueStats = options.getQueueStats;
            this.getEnrollmentState = options.getEnrollmentState;
        }
    }
    getHealthStatus() {
        const enrollmentState = this.getEnrollmentState?.();
        const queue = this.getQueueStats?.();
        const isDegraded = enrollmentState === 'REVOKED' || (queue !== undefined && queue.failedCount > 0);
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
//# sourceMappingURL=health.service.js.map