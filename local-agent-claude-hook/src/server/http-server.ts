import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import { AgentAuthService } from '../backend/agent-auth.service.js';
import { BackendClient } from '../backend/backend-client.js';
import { ConfigService, getConfigService } from '../config/config.service.js';
import { resolveLocalDeviceId } from '../config/device-identity.js';
import { ClaudeCodeHookHandler } from '../connectors/claude-code/hook-handler.js';
import { EventNormalizer } from '../events/event-normalizer.js';
import { EventProcessor } from '../events/event-processor.js';
import { HealthService } from '../health/health.service.js';
import { QueueService } from '../queue/queue.service.js';
import { RedactionService } from '../security/redaction.service.js';
import { registerClaudeCodeRoute } from './routes/claude-code.route.js';
import { registerHealthRoute } from './routes/health.route.js';

export interface BuildServerOptions {
  configService?: ConfigService;
  healthService?: HealthService;
  queueService?: QueueService;
  eventProcessor?: EventProcessor;
  hookHandler?: ClaudeCodeHookHandler;
}

export async function buildServer(
  options: BuildServerOptions = {},
): Promise<FastifyInstance> {
  const config = options.configService ?? getConfigService();
  const resolvedDeviceId = resolveLocalDeviceId(config.agentDeviceId);

  const queueService =
    options.queueService ??
    new QueueService({
      dbPath: config.isTest ? ':memory:' : config.sqliteDbPath,
      maxCapacity: config.queueMaxCapacity,
    });

  const healthService =
    options.healthService ??
    new HealthService({
      version: '1.0.0',
      getQueueStats: () => queueService.getStats(),
    });

  const eventProcessor =
    options.eventProcessor ??
    new EventProcessor({
      redactionService: new RedactionService(),
      eventNormalizer: new EventNormalizer({
        deviceId: resolvedDeviceId,
      }),
      queueService,
    });

  const hookHandler =
    options.hookHandler ??
    new ClaudeCodeHookHandler({
      eventProcessor,
    });

  const loggerOptions: FastifyServerOptions['logger'] =
    config.logLevel === 'silent'
      ? false
      : {
          level: config.logLevel,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers["x-webhook-token"]',
              'req.headers["x-agent-token"]',
              'headers.authorization',
              'headers["x-webhook-token"]',
              '*.password',
              '*.secret',
              '*.token',
            ],
            censor: '[REDACTED]',
          },
        };

  const server = Fastify({
    logger: loggerOptions,
    bodyLimit: config.maxBodyBytes,
  });

  const agentAuthService = new AgentAuthService({
    deviceId: resolvedDeviceId,
    credentialToken: config.agentCredentialToken || 'dev-local-agent-token',
  });

  const backendClient = new BackendClient({
    baseUrl: config.backendBaseUrl,
    agentAuthService,
    timeoutMs: config.backendTimeoutMs,
  });

  let isFlushing = false;
  let flushTimer: NodeJS.Timeout | null = null;

  const triggerBackgroundFlush = async (): Promise<void> => {
    if (isFlushing) return;
    const stats = queueService.getStats();
    if (stats.pendingCount === 0) return;

    isFlushing = true;
    try {
      const outcome = await backendClient.flushPendingQueueBatch(queueService, 20);
      if (outcome.deliveredCount > 0) {
        server.log.info(
          { delivered: outcome.deliveredCount, remaining: queueService.getStats().pendingCount },
          'Flushed queued events to NestJS backend (Supabase)',
        );
      }
    } catch (err) {
      server.log.warn({ err }, 'Background queue flush failed');
    } finally {
      isFlushing = false;
    }
  };

  if (!config.isTest) {
    flushTimer = setInterval(() => {
      void triggerBackgroundFlush();
    }, 5000);
    flushTimer.unref();
  }

  server.addHook('onClose', async () => {
    if (flushTimer) {
      clearInterval(flushTimer);
    }
    queueService.close();
  });

  server.setErrorHandler(async (error: FastifyError, request, reply) => {
    if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE' || error.statusCode === 413) {
      request.log.warn(
        { url: request.url, maxBodyBytes: config.maxBodyBytes },
        'Rejected oversized request payload',
      );
      return reply.code(413).send({
        status: 'error',
        error: 'PAYLOAD_TOO_LARGE',
        message: `Request body exceeds maximum allowed size of ${config.maxBodyBytes} bytes.`,
      });
    }

    if (
      error.code === 'FST_ERR_CTP_INVALID_JSON_BODY' ||
      error.code === 'FST_ERR_CTP_EMPTY_JSON_BODY' ||
      error.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE'
    ) {
      return reply.code(400).send({
        status: 'error',
        error: 'INVALID_JSON_REQUEST',
        message: 'Request must contain a valid application/json body.',
      });
    }

    request.log.error({ err: error }, 'Unhandled server error');
    return reply.code(error.statusCode ?? 500).send({
      status: 'error',
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    });
  });

  await registerHealthRoute(server, { healthService, queueService });
  await registerClaudeCodeRoute(server, {
    configService: config,
    hookHandler,
  });

  return server;
}
