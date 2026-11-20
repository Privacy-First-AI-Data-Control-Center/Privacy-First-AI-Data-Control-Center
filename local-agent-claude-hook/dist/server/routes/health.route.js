import { HealthService } from '../../health/health.service.js';
export async function registerHealthRoute(app, options = {}) {
    const healthService = options.healthService ?? new HealthService();
    const { queueService } = options;
    app.get('/health', async (_request, reply) => {
        const payload = healthService.getHealthStatus();
        return reply.code(200).send(payload);
    });
    if (queueService) {
        app.get('/events', async (request, reply) => {
            const query = request.query;
            const parsedLimit = Number(query?.limit ?? 50);
            const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
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
//# sourceMappingURL=health.route.js.map