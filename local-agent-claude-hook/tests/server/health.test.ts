import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ConfigService } from '../../src/config/config.service.js';
import { parseEnv } from '../../src/config/env.js';
import { buildServer } from '../../src/server/http-server.js';

describe('Stage 1: Local Agent Foundation & Health Endpoint', () => {
  let server: FastifyInstance | null = null;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  it('GET /health returns 200 with structured health payload', async () => {
    const configService = new ConfigService({
      skipDotenv: true,
      env: {
        NODE_ENV: 'test',
        HOST: '127.0.0.1',
        PORT: '43127',
        LOG_LEVEL: 'silent',
        LOCAL_WEBHOOK_TOKEN: 'test-webhook-secret-token-12345',
      },
    });

    server = await buildServer({ configService });

    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual({
      status: 'ok',
      service: 'local-agent-claude-hook',
      version: '1.0.0',
      uptimeSeconds: expect.any(Number),
      timestamp: expect.any(String),
    });
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('rejects non-loopback HOST (0.0.0.0) to prevent external network exposure', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'development',
        HOST: '0.0.0.0',
      }),
    ).toThrow(/HOST/);
  });

  it('rejects out-of-range PORT values', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'development',
        PORT: '70000',
      }),
    ).toThrow(/PORT/);
  });

  it('requires a custom LOCAL_WEBHOOK_TOKEN (>= 16 chars) in production', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
      }),
    ).toThrow(/LOCAL_WEBHOOK_TOKEN/);

    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        LOCAL_WEBHOOK_TOKEN: 'dev-local-webhook-token-change-me',
      }),
    ).toThrow(/LOCAL_WEBHOOK_TOKEN/);

    const validProd = parseEnv({
      NODE_ENV: 'production',
      LOCAL_WEBHOOK_TOKEN: 'prod-secure-token-9876543210',
    });
    expect(validProd.LOCAL_WEBHOOK_TOKEN).toBe('prod-secure-token-9876543210');
  });
});
