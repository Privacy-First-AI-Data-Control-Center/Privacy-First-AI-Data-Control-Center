import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ConfigService } from '../../src/config/config.service.js';
import { buildServer } from '../../src/server/http-server.js';

describe('Stage 2: POST /hooks/claude-code Webhook Receiver', () => {
  const validToken = 'test-webhook-secret-token-12345';
  let server: FastifyInstance | null = null;

  async function createTestServer(maxBodyBytes = '1024'): Promise<FastifyInstance> {
    const configService = new ConfigService({
      skipDotenv: true,
      env: {
        NODE_ENV: 'test',
        HOST: '127.0.0.1',
        PORT: '43127',
        LOG_LEVEL: 'silent',
        LOCAL_WEBHOOK_TOKEN: validToken,
        MAX_BODY_BYTES: maxBodyBytes,
      },
    });
    server = await buildServer({ configService });
    return server;
  }

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  it('accepts valid PostToolUse hook payload with x-webhook-token and returns 202', async () => {
    const app = await createTestServer();

    const response = await app.inject({
      method: 'POST',
      url: '/hooks/claude-code',
      headers: {
        'content-type': 'application/json',
        'x-webhook-token': validToken,
      },
      payload: {
        hook_event_name: 'PostToolUse',
        session_id: 'session-abc-123',
        cwd: '/home/shohag-rana/project',
        tool_name: 'Bash',
        tool_input: {
          command: 'npm test',
        },
        tool_response: {
          exitCode: 0,
        },
      },
    });

    expect(response.statusCode).toBe(202);
    const body = response.json();
    expect(body).toEqual({
      status: 'accepted',
      receiptId: expect.any(String),
      eventId: expect.any(String),
      dedupeKey: expect.any(String),
      queued: true,
      duplicate: false,
      redacted: false,
      connector: 'claude-code',
      hookEventName: 'PostToolUse',
      eventType: 'tool.command.completed',
      category: 'command_execution',
      severity: 'info',
      confidence: 'observed',
      toolName: 'Bash',
      sessionId: 'session-abc-123',
      summary: 'Claude Code completed Bash command',
      receivedAt: expect.any(String),
    });
  });

  it('accepts valid SessionStart hook payload with Authorization Bearer header', async () => {
    const app = await createTestServer();

    const response = await app.inject({
      method: 'POST',
      url: '/hooks/claude-code',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${validToken}`,
      },
      payload: {
        hook_event_name: 'SessionStart',
        session_id: 'session-xyz-999',
        cwd: '/workspace',
      },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toMatchObject({
      status: 'accepted',
      connector: 'claude-code',
      hookEventName: 'SessionStart',
      toolName: null,
      sessionId: 'session-xyz-999',
    });
  });

  it('rejects requests with missing webhook token with 401 Unauthorized', async () => {
    const app = await createTestServer();

    const response = await app.inject({
      method: 'POST',
      url: '/hooks/claude-code',
      payload: {
        hook_event_name: 'PostToolUse',
        tool_name: 'Read',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      status: 'error',
      error: 'UNAUTHORIZED_WEBHOOK',
      message: 'Missing or invalid local webhook authentication token.',
    });
  });

  it('rejects requests with invalid webhook token with 401 Unauthorized', async () => {
    const app = await createTestServer();

    const response = await app.inject({
      method: 'POST',
      url: '/hooks/claude-code',
      headers: {
        'x-webhook-token': 'invalid-token-attempt',
      },
      payload: {
        hook_event_name: 'PostToolUse',
        tool_name: 'Read',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('UNAUTHORIZED_WEBHOOK');
  });

  it('rejects invalid payload (PostToolUse missing tool_name) with 400 Bad Request', async () => {
    const app = await createTestServer();

    const response = await app.inject({
      method: 'POST',
      url: '/hooks/claude-code',
      headers: {
        'x-webhook-token': validToken,
      },
      payload: {
        hook_event_name: 'PostToolUse',
        session_id: 'session-1',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('INVALID_HOOK_PAYLOAD');
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'tool_name',
        }),
      ]),
    );
  });

  it('rejects oversized payload exceeding MAX_BODY_BYTES with 413 Payload Too Large', async () => {
    const app = await createTestServer('256'); // 256 bytes limit

    const response = await app.inject({
      method: 'POST',
      url: '/hooks/claude-code',
      headers: {
        'x-webhook-token': validToken,
      },
      payload: {
        hook_event_name: 'PostToolUse',
        tool_name: 'Write',
        tool_input: {
          content: 'x'.repeat(500),
        },
      },
    });

    expect(response.statusCode).toBe(413);
    expect(response.json()).toMatchObject({
      status: 'error',
      error: 'PAYLOAD_TOO_LARGE',
    });
  });
});
