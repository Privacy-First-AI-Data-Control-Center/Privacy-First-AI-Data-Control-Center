import { type FastifyInstance } from 'fastify';
import { ConfigService } from '../config/config.service.js';
import { ClaudeCodeHookHandler } from '../connectors/claude-code/hook-handler.js';
import { EventProcessor } from '../events/event-processor.js';
import { HealthService } from '../health/health.service.js';
import { PolicyEngineService } from '../policy/policy-engine.service.js';
import { QueueService } from '../queue/queue.service.js';
export interface BuildServerOptions {
    configService?: ConfigService;
    healthService?: HealthService;
    queueService?: QueueService;
    eventProcessor?: EventProcessor;
    hookHandler?: ClaudeCodeHookHandler;
    policyEngine?: PolicyEngineService;
}
export declare function buildServer(options?: BuildServerOptions): Promise<FastifyInstance>;
