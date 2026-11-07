import type { FastifyInstance } from 'fastify';
import { ConfigService } from '../../config/config.service.js';
import {
  ClaudeCodeHookHandler,
  ClaudeCodeHookPayloadSchema,
} from '../../connectors/claude-code/hook-handler.js';
import { createWebhookAuthPreHandler } from '../../security/webhook-auth.js';

export interface ClaudeCodeRouteOptions {
  configService: ConfigService;
  hookHandler?: ClaudeCodeHookHandler;
}

export async function registerClaudeCodeRoute(
  app: FastifyInstance,
  options: ClaudeCodeRouteOptions,
): Promise<void> {
  const { configService } = options;
  const hookHandler = options.hookHandler ?? new ClaudeCodeHookHandler();
  const authPreHandler = createWebhookAuthPreHandler(
    configService.localWebhookToken,
  );

  app.post(
    '/hooks/claude-code',
    {
      preHandler: [authPreHandler],
      bodyLimit: configService.maxBodyBytes,
    },
    async (request, reply) => {
      const parseResult = ClaudeCodeHookPayloadSchema.safeParse(request.body);

      if (!parseResult.success) {
        const details = parseResult.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'body',
          message: issue.message,
        }));

        request.log.warn(
          { validationIssues: details },
          'Rejected invalid Claude Code hook payload',
        );

        return reply.code(400).send({
          status: 'error',
          error: 'INVALID_HOOK_PAYLOAD',
          message: 'Webhook payload failed validation.',
          details,
        });
      }

      const receipt = await hookHandler.handleHookPayload(parseResult.data);

      request.log.info(
        {
          receiptId: receipt.receiptId,
          eventId: receipt.eventId,
          hookEventName: receipt.hookEventName,
          eventType: receipt.eventType,
          category: receipt.category,
          severity: receipt.severity,
          toolName: receipt.toolName,
          sessionId: receipt.sessionId,
        },
        'Accepted and mapped Claude Code hook event',
      );

      return reply.code(202).send(receipt);
    },
  );
}
