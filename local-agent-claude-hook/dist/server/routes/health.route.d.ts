import type { FastifyInstance } from 'fastify';
import { HealthService } from '../../health/health.service.js';
import type { QueueService } from '../../queue/queue.service.js';
export interface HealthRouteOptions {
    healthService?: HealthService;
    queueService?: QueueService;
}
export declare function registerHealthRoute(app: FastifyInstance, options?: HealthRouteOptions): Promise<void>;
