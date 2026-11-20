import type { preHandlerHookHandler } from 'fastify';
/**
 * Extracts the webhook token from either:
 * 1. `x-webhook-token: <token>` header
 * 2. `Authorization: Bearer <token>` header
 */
export declare function extractWebhookToken(headers: Record<string, string | string[] | undefined>): string | null;
/**
 * Performs a constant-time comparison between the provided webhook token
 * and the expected local webhook secret.
 */
export declare function verifyWebhookToken(providedToken: string | null | undefined, expectedToken: string): boolean;
/**
 * Fastify preHandler hook that enforces local webhook token authentication.
 */
export declare function createWebhookAuthPreHandler(expectedToken: string): preHandlerHookHandler;
