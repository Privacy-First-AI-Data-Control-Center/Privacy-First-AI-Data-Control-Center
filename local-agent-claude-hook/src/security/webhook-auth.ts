import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';

function sha256Buffer(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

/**
 * Extracts the webhook token from either:
 * 1. `x-webhook-token: <token>` header
 * 2. `Authorization: Bearer <token>` header
 */
export function extractWebhookToken(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const customHeader = headers['x-webhook-token'];
  if (typeof customHeader === 'string' && customHeader.trim().length > 0) {
    return customHeader.trim();
  }

  const authHeader = headers.authorization;
  if (typeof authHeader === 'string') {
    const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
    if (match?.[1] && match[1].trim().length > 0) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Performs a constant-time comparison between the provided webhook token
 * and the expected local webhook secret.
 */
export function verifyWebhookToken(
  providedToken: string | null | undefined,
  expectedToken: string,
): boolean {
  if (!providedToken || !expectedToken) {
    return false;
  }

  const providedHash = sha256Buffer(providedToken);
  const expectedHash = sha256Buffer(expectedToken);

  return timingSafeEqual(providedHash, expectedHash);
}

/**
 * Fastify preHandler hook that enforces local webhook token authentication.
 */
export function createWebhookAuthPreHandler(
  expectedToken: string,
): preHandlerHookHandler {
  return async function webhookAuthPreHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const providedToken = extractWebhookToken(request.headers);

    if (!verifyWebhookToken(providedToken, expectedToken)) {
      request.log.warn(
        {
          url: request.url,
          method: request.method,
          hasToken: Boolean(providedToken),
        },
        'Rejected unauthorized local webhook request',
      );

      await reply.code(401).send({
        status: 'error',
        error: 'UNAUTHORIZED_WEBHOOK',
        message: 'Missing or invalid local webhook authentication token.',
      });
    }
  };
}
