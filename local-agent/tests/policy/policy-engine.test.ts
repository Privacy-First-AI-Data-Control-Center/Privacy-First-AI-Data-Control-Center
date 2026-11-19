import { describe, expect, it } from 'vitest';
import { ConfigService } from '../../src/config/config.service.js';
import { PolicyEngineService } from '../../src/policy/policy-engine.service.js';
import { buildServer } from '../../src/server/http-server.js';

describe('PolicyEngineService & Multi-AI PreToolUse Blocking', () => {
  const webhookToken = 'test-webhook-token-1234567890';

  const makeTestConfig = () =>
    new ConfigService({
      skipDotenv: true,
      env: {
        NODE_ENV: 'test',
        HOST: '127.0.0.1',
        PORT: '43127',
        LOG_LEVEL: 'silent',
        LOCAL_WEBHOOK_TOKEN: webhookToken,
      },
    });

  const makePolicyEngine = () => {
    const engine = new PolicyEngineService();
    engine.setPolicies([
      {
        id: 9,
        workspaceId: 10,
        name: 'Block Secret & Env Files',
        priority: 100,
        status: 'ACTIVE',
        policyVersionId: 11,
        versionNumber: 1,
        rules: [
          {
            id: 23,
            ruleType: 'SENSITIVE_DATA',
            condition: {
              filePatterns: ['.env', '.pem', 'id_rsa'],
              commandPatterns: ['cat .env', 'rm -rf'],
            },
            effect: 'BLOCK',
            actionConfig: {
              reason: 'Blocked by Privacy Policy: Access to .env or secret files is prohibited',
            },
            enabled: true,
            position: 1,
          },
        ],
      },
    ]);
    return engine;
  };

  it('blocks .env reads on /hooks/cursor, /hooks/claude-code, and /hooks/antigravity', async () => {
    const app = await buildServer({
      configService: makeTestConfig(),
      policyEngine: makePolicyEngine(),
    });

    for (const route of ['/hooks/cursor', '/hooks/claude-code', '/hooks/antigravity']) {
      const res = await app.inject({
        method: 'POST',
        url: route,
        headers: { 'x-webhook-token': webhookToken },
        payload: {
          hook_event_name: 'PreToolUse',
          session_id: `sess-${route}`,
          tool_name: 'Read',
          tool_input: { file_path: '/project/.env' },
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe('blocked');
      expect(body.decision).toBe('block');
      expect(body.policyName).toBe('Block Secret & Env Files');
      expect(body.hookSpecificOutput?.permissionDecision).toBe('deny');
    }

    await app.close();
  });

  it('allows normal files like README.md on /hooks/cursor', async () => {
    const app = await buildServer({
      configService: makeTestConfig(),
      policyEngine: makePolicyEngine(),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/hooks/cursor',
      headers: { 'x-webhook-token': webhookToken },
      payload: {
        hook_event_name: 'PreToolUse',
        session_id: 'sess-allow-cursor',
        tool_name: 'Read',
        tool_input: { file_path: '/project/README.md' },
      },
    });

    expect(res.statusCode).toBe(202);
    expect(res.json().status).toBe('accepted');

    await app.close();
  });

  it('blocks dangerous bash commands like rm -rf on /hooks/cursor', async () => {
    const app = await buildServer({
      configService: makeTestConfig(),
      policyEngine: makePolicyEngine(),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/hooks/cursor',
      headers: { 'x-webhook-token': webhookToken },
      payload: {
        hook_event_name: 'PreToolUse',
        session_id: 'sess-bash-block',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/test' },
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().decision).toBe('block');

    await app.close();
  });
});
