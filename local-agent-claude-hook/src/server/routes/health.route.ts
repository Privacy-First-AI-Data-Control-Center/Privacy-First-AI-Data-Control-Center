import type { FastifyInstance } from 'fastify';
import { HealthService } from '../../health/health.service.js';
import type { QueueService } from '../../queue/queue.service.js';

export interface HealthRouteOptions {
  healthService?: HealthService;
  queueService?: QueueService;
}

export async function registerHealthRoute(
  app: FastifyInstance,
  options: HealthRouteOptions = {},
): Promise<void> {
  const healthService = options.healthService ?? new HealthService();
  const { queueService } = options;

  app.get('/health', async (_request, reply) => {
    const payload = healthService.getHealthStatus();
    return reply.code(200).send(payload);
  });

  if (queueService) {
    app.get('/events', async (request, reply) => {
      const query = request.query as { limit?: string } | undefined;
      const parsedLimit = Number(query?.limit ?? 50);
      const safeLimit =
        Number.isFinite(parsedLimit) && parsedLimit > 0
          ? Math.min(Math.floor(parsedLimit), 200)
          : 50;

      const items = queueService.listRecent(safeLimit);
      const stats = queueService.getStats();

      return reply.code(200).send({
        status: 'ok',
        queue: stats,
        count: items.length,
        events: items,
      });
    });
  }
}
