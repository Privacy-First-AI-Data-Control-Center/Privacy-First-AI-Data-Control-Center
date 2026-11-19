import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentAuthService } from '../../src/backend/agent-auth.service.js';
import {
  AGENT_API_PATHS,
  BackendClient,
} from '../../src/backend/backend-client.js';
import { ClaudeCodeEventMapper } from '../../src/connectors/claude-code/event-mapper.js';
import { EventNormalizer } from '../../src/events/event-normalizer.js';
import { EventProcessor } from '../../src/events/event-processor.js';
import { QueueService } from '../../src/queue/queue.service.js';
import { RedactionService } from '../../src/security/redaction.service.js';

describe('Stage 5: AgentAuthService & BackendClient (/api/v1/agent/*)', () => {
  let queueService: QueueService | null = null;

  afterEach(() => {
    if (queueService) {
      queueService.close();
      queueService = null;
    }
  });

  it('completes device enrollment and stores device-bound AgentCredential', async () => {
    const authService = new AgentAuthService();
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getEnrollmentState()).toBe('UNENROLLED');

    const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe(
        `http://127.0.0.1:3001/api/v1${AGENT_API_PATHS.COMPLETE_ENROLLMENT}`,
      );
      expect(init?.method).toBe('POST');

      return new Response(
        JSON.stringify({
          deviceId: 'device-uuid-9001',
          agentCredential: 'agent-cred-secret-token-xyz-987654',
        }),
        {
          status: 201,
          headers: { 'content-type': 'application/json' },
        },
      );
    });

    const client = new BackendClient({
      baseUrl: 'http://127.0.0.1:3001/api/v1',
      agentAuthService: authService,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    const result = await client.completeEnrollment({
      enrollmentToken: 'one-time-enroll-token',
      deviceName: 'Shohag-Linux-Workstation',
      agentVersion: '1.0.0',
      installationId: 'inst-001',
    });

    expect(result.ok).toBe(true);
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getEnrollmentState()).toBe('ENROLLED');
    expect(authService.getDeviceId()).toBe('device-uuid-9001');
    expect(authService.getAuthHeaders()).toEqual({
      Authorization: 'Bearer agent-cred-secret-token-xyz-987654',
      'x-agent-device-id': 'device-uuid-9001',
    });
  });

  it('calls heartbeat, config, connectors, active policies, and enforcement-results with AgentCredential headers', async () => {
    const authService = new AgentAuthService({
      deviceId: 'device-uuid-100',
      credentialToken: 'agent-secret-token-100',
    });

    const calledPaths: string[] = [];

    const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer agent-secret-token-100');
      expect(headers['x-agent-device-id']).toBe('device-uuid-100');

      const urlStr = String(url).replace('http://127.0.0.1:3001/api/v1', '');
      calledPaths.push(`${init?.method} ${urlStr}`);

      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const client = new BackendClient({
      baseUrl: 'http://127.0.0.1:3001/api/v1',
      agentAuthService: authService,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    await client.sendHeartbeat({
      agentVersion: '1.0.0',
      status: 'online',
      uptimeSeconds: 120,
      pendingQueueCount: 0,
      observedAt: new Date().toISOString(),
    });
    await client.fetchAgentConfig();
    await client.fetchConnectorsConfig();
    await client.fetchActivePolicies();
    await client.reportEnforcementResult({
      eventId: '00000000-0000-4000-8000-000000000001',
      actionType: 'block',
      outcome: 'succeeded',
      evidence: { hook: 'PreToolUse', exitCode: 2 },
      performedAt: new Date().toISOString(),
    });

    expect(calledPaths).toEqual([
      `POST ${AGENT_API_PATHS.HEARTBEAT}`,
      `GET ${AGENT_API_PATHS.CONFIG}`,
      `GET ${AGENT_API_PATHS.CONNECTORS}`,
      `GET ${AGENT_API_PATHS.ACTIVE_POLICIES}`,
      `POST ${AGENT_API_PATHS.ENFORCEMENT_RESULTS}`,
    ]);
  });

  it('flushes pending SQLite queue batch to POST /agent/events/batch and marks events DELIVERED', async () => {
    queueService = new QueueService({ dbPath: ':memory:' });
    const processor = new EventProcessor({
      redactionService: new RedactionService(),
      eventNormalizer: new EventNormalizer({ deviceId: 'device-uuid-200' }),
      queueService,
    });
    const mapper = new ClaudeCodeEventMapper('1.0.0');

    processor.processMappedEvent(
      mapper.mapHookToEvent({
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        tool_use_id: 'toolu_batch_1',
        tool_input: { command: 'git status' },
      }),
    );

    expect(queueService.getStats().pendingCount).toBe(1);

    const authService = new AgentAuthService({
      deviceId: 'device-uuid-200',
      credentialToken: 'agent-secret-token-200',
    });

    const mockFetch = vi.fn(async () => {
      return new Response(JSON.stringify({ accepted: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const client = new BackendClient({
      baseUrl: 'http://127.0.0.1:3001/api/v1',
      agentAuthService: authService,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    const flushResult = await client.flushPendingQueueBatch(queueService, 10);

    expect(flushResult).toEqual({
      attemptedCount: 1,
      deliveredCount: 1,
      failedCount: 0,
      skippedUnenrolled: false,
      credentialRevoked: false,
    });

    expect(queueService.getStats()).toEqual({
      pendingCount: 0,
      deliveredCount: 1,
      failedCount: 0,
      totalCount: 1,
    });
  });

  it('marks AgentCredential as REVOKED and schedules retry when backend returns 401/403', async () => {
    queueService = new QueueService({ dbPath: ':memory:' });
    const processor = new EventProcessor({
      redactionService: new RedactionService(),
      eventNormalizer: new EventNormalizer({ deviceId: 'device-uuid-300' }),
      queueService,
    });
    const mapper = new ClaudeCodeEventMapper('1.0.0');

    const { normalizedEvent } = processor.processMappedEvent(
      mapper.mapHookToEvent({
        hook_event_name: 'PostToolUse',
        tool_name: 'Read',
        tool_use_id: 'toolu_revoked_1',
        tool_input: { file_path: '/workspace/app.ts' },
      }),
    );

    const authService = new AgentAuthService({
      deviceId: 'device-uuid-300',
      credentialToken: 'revoked-agent-credential',
    });

    const mockFetch = vi.fn(async () => {
      return new Response(JSON.stringify({ message: 'Device credential revoked' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    });

    const client = new BackendClient({
      baseUrl: 'http://127.0.0.1:3001/api/v1',
      agentAuthService: authService,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    const flushResult = await client.flushPendingQueueBatch(queueService, 10);

    expect(flushResult.credentialRevoked).toBe(true);
    expect(flushResult.failedCount).toBe(1);
    expect(authService.isRevoked()).toBe(true);
    expect(authService.isAuthenticated()).toBe(false);

    // Event remains safely in SQLite queue with retryCount = 1 so no telemetry is lost
    const row = queueService.findById(normalizedEvent.eventId);
    expect(row?.status).toBe('PENDING');
    expect(row?.retryCount).toBe(1);
  });
});
