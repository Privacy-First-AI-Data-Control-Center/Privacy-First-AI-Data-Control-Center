import type { FastifyInstance } from 'fastify';
import { HealthService } from '../../health/health.service.js';

export interface HealthRouteOptions {
  healthService?: HealthService;
}

export async function registerHealthRoute(
  app: FastifyInstance,
  options: HealthRouteOptions = {},
): Promise<void> {
  const healthService = options.healthService ?? new HealthService();

  app.get('/health', async (_request, reply) => {
    const payload = healthService.getHealthStatus();
    return reply.code(200).send(payload);
  });
}
