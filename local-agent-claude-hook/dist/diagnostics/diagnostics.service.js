import { platform, release } from 'node:os';
import { RedactionService } from '../security/redaction.service.js';
/**
 * Collects sanitized operational diagnostics and runtime telemetry for
 * local health inspection and `POST /api/v1/agent/diagnostics`.
 */
export class DiagnosticsService {
    agentVersion;
    agentAuthService;
    queueService;
    redactionService;
    maxRecentErrors;
    recentErrors = [];
    constructor(options) {
        this.agentVersion = options.agentVersion ?? '1.0.0';
        this.agentAuthService = options.agentAuthService;
        this.queueService = options.queueService;
        this.redactionService = options.redactionService ?? new RedactionService();
        this.maxRecentErrors = options.maxRecentErrors ?? 25;
    }
    recordOperationalError(code, rawMessage) {
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
    getSnapshot() {
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
//# sourceMappingURL=diagnostics.service.js.map