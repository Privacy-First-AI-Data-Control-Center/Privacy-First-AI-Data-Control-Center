import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { AgentAuthService } from '../../src/backend/agent-auth.service.js';
import { BackendClient } from '../../src/backend/backend-client.js';
import { ConfigService } from '../../src/config/config.service.js';
import { ClaudeCodeConnectorService } from '../../src/connectors/claude-code/connector.service.js';
import { ClaudeCodeHookHandler } from '../../src/connectors/claude-code/hook-handler.js';
import { DiagnosticsService } from '../../src/diagnostics/diagnostics.service.js';
import { EventNormalizer } from '../../src/events/event-normalizer.js';
import { EventProcessor } from '../../src/events/event-processor.js';
import { HealthService } from '../../src/health/health.service.js';
import { QueueService } from '../../src/queue/queue.service.js';
import { RedactionService } from '../../src/security/redaction.service.js';
import { buildServer } from '../../src/server/http-server.js';

describe('Stages 6 & 7: Diagnostics, Queue Reliability & Full End-to-End Pipeline', () => {
  let server: FastifyInstance | null = null;
  let queueService: QueueService | null = null;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
    if (queueService) {
      queueService.close();
      queueService = null;
    }
  });

  it('collects sanitized operational diagnostics and redacts secret strings in error messages', () => {
    queueService = new QueueService({ dbPath: ':memory:' });
    const authService = new AgentAuthService({
      deviceId: 'device-diag-01',
      credentialToken: 'cred-token-diag-01',
    });

    const diagnostics = new DiagnosticsService({
      agentVersion: '1.0.0',
      agentAuthService: authService,
      queueService,
    });

    diagnostics.recordOperationalError(
      'BACKEND_SYNC_ERR',
      'Failed connecting with token sk-ant-api03-secret9999999999999999 to backend',
    );

    const snapshot = diagnostics.getSnapshot();

    expect(snapshot.agentVersion).toBe('1.0.0');
    expect(snapshot.enrollment).toEqual({
      deviceId: 'device-diag-01',
      state: 'ENROLLED',
      isAuthenticated: true,
      isRevoked: false,
    });
    expect(snapshot.recentErrors).toHaveLength(1);
    expect(snapshot.recentErrors[0]?.message).not.toContain('sk-ant-api03-secret9999999999999999');
    expect(snapshot.recentErrors[0]?.message).toContain('[REDACTED:ANTHROPIC_API_KEY]');
  });

  it('runs the complete End-to-End flow: Claude Code Hook -> Fastify Receiver -> Mapper -> Redaction -> SQLite -> Backend Batch Ingestion', async () => {
    const webhookSecret = 'e2e-local-webhook-secret-token-2026';

    const configService = new ConfigService({
      skipDotenv: true,
      env: {
        NODE_ENV: 'test',
        HOST: '127.0.0.1',
        PORT: '43127',
        LOG_LEVEL: 'silent',
        LOCAL_WEBHOOK_TOKEN: webhookSecret,
        AGENT_DEVICE_ID: 'device-e2e-777',
      },
    });

    queueService = new QueueService({ dbPath: ':memory:' });
    const authService = new AgentAuthService({
      deviceId: 'device-e2e-777',
      credentialToken: 'device-bound-agent-credential-777',
    });

    const eventProcessor = new EventProcessor({
      redactionService: new RedactionService(),
      eventNormalizer: new EventNormalizer({ deviceId: authService.getDeviceId() }),
      queueService,
    });

    const hookHandler = new ClaudeCodeHookHandler({
      connectorService: new ClaudeCodeConnectorService({ version: '1.0.0' }),
      eventProcessor,
    });

    const healthService = new HealthService({
      version: '1.0.0',
      getQueueStats: () => queueService!.getStats(),
      getEnrollmentState: () => authService.getEnrollmentState(),
    });

    server = await buildServer({
      configService,
      healthService,
      queueService,
      eventProcessor,
      hookHandler,
    });

    // Step 1: Claude Code native HTTP hook sends PostToolUse containing an accidental API key
    const hookResponse = await server.inject({
      method: 'POST',
      url: '/hooks/claude-code',
      headers: {
        'content-type': 'application/json',
        'x-webhook-token': webhookSecret,
      },
      payload: {
        hook_event_name: 'PostToolUse',
        session_id: 'claude-session-e2e-1',
        cwd: '/home/shohag-rana/workspace',
        tool_name: 'Bash',
        tool_use_id: 'toolu_e2e_001',
        tool_input: {
          command: 'curl -H "Authorization: Bearer ghp_1234567890abcdefghijklmnopqrstuv" https://api.github.com/user',
        },
      },
    });

    expect(hookResponse.statusCode).toBe(202);
    const receipt = hookResponse.json();
    expect(receipt.queued).toBe(true);
    expect(receipt.redacted).toBe(true);
    expect(receipt.eventType).toBe('tool.command.completed');

    // Step 2: Check /health shows 1 pending event in SQLite queue and ENROLLED state
    const healthBeforeFlush = (await server.inject({ method: 'GET', url: '/health' })).json();
    expect(healthBeforeFlush.enrollmentState).toBe('ENROLLED');
    expect(healthBeforeFlush.queue.pendingCount).toBe(1);

    // Step 3: BackendClient flushes SQLite queue to NestJS POST /api/v1/agent/events/batch
    let receivedBatchPayload: Record<string, unknown> | null = null;
    const mockBackendFetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      receivedBatchPayload = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ status: 'ok', ingested: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const backendClient = new BackendClient({
      baseUrl: configService.backendBaseUrl,
      agentAuthService: authService,
      fetchImpl: mockBackendFetch as unknown as typeof fetch,
    });

    const flushOutcome = await backendClient.flushPendingQueueBatch(queueService, 20);
    expect(flushOutcome).toEqual({
      attemptedCount: 1,
      deliveredCount: 1,
      failedCount: 0,
      skippedUnenrolled: false,
      credentialRevoked: false,
    });

    // Step 4: Verify the payload sent to NestJS has the secret redacted and never leaked
    expect(receivedBatchPayload).not.toBeNull();
    const serializedBatch = JSON.stringify(receivedBatchPayload);
    expect(serializedBatch).not.toContain('ghp_1234567890abcdefghijklmnopqrstuv');
    expect(serializedBatch).toContain('[REDACTED:GITHUB_TOKEN]');

    // Step 5: Verify SQLite queue now shows 0 pending and 1 delivered
    const healthAfterFlush = (await server.inject({ method: 'GET', url: '/health' })).json();
    expect(healthAfterFlush.queue).toEqual({
      pendingCount: 0,
      deliveredCount: 1,
      failedCount: 0,
      totalCount: 1,
    });
  });
});
