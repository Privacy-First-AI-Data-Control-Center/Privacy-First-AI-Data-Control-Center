import { describe, expect, it } from 'vitest';
import {
  extractWebhookToken,
  verifyWebhookToken,
} from '../../src/security/webhook-auth.js';

describe('Stage 2: Webhook Authentication Security', () => {
  const secret = 'super-secret-local-webhook-token-2026';

  it('extracts token from x-webhook-token header', () => {
    const token = extractWebhookToken({
      'x-webhook-token': '  my-custom-token  ',
    });
    expect(token).toBe('my-custom-token');
  });

  it('extracts token from Authorization Bearer header', () => {
    const token = extractWebhookToken({
      authorization: 'Bearer my-bearer-token-123',
    });
    expect(token).toBe('my-bearer-token-123');
  });

  it('returns null when no token header is present', () => {
    expect(extractWebhookToken({})).toBeNull();
    expect(extractWebhookToken({ authorization: 'Basic abc' })).toBeNull();
  });

  it('verifies matching tokens and rejects mismatched or empty tokens', () => {
    expect(verifyWebhookToken(secret, secret)).toBe(true);
    expect(verifyWebhookToken('wrong-token-value-1234', secret)).toBe(false);
    expect(verifyWebhookToken('', secret)).toBe(false);
    expect(verifyWebhookToken(null, secret)).toBe(false);
  });
});
