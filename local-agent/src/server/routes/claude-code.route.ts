import type { FastifyInstance } from 'fastify';
import { ConfigService } from '../../config/config.service.js';
import type { ConnectorSlug } from '../../connectors/claude-code/event-mapper.js';
import {
  ClaudeCodeHookHandler,
  ClaudeCodeHookPayloadSchema,
} from '../../connectors/claude-code/hook-handler.js';
import type { PolicyEngineService } from '../../policy/policy-engine.service.js';
import { createWebhookAuthPreHandler } from '../../security/webhook-auth.js';

export interface ClaudeCodeRouteOptions {
  configService: ConfigService;
  hookHandler?: ClaudeCodeHookHandler;
  policyEngine?: PolicyEngineService;
}

/**
 * One local receiver per AI tool, so every event is tagged with its real source:
 * - POST /hooks/claude-code  (Claude Code native HTTP hooks)
 * - POST /hooks/antigravity  (Antigravity, via antigravity-hook-bridge.mjs)
 * - POST /hooks/gemini-cli   (Gemini CLI, via antigravity-hook-bridge.mjs)
 */
const HOOK_ROUTES: ReadonlyArray<{ path: string; connector: ConnectorSlug }> = [
  { path: '/hooks/claude-code', connector: 'claude-code' },
  { path: '/hooks/antigravity', connector: 'antigravity' },
  { path: '/hooks/gemini-cli', connector: 'gemini-cli' },
  { path: '/hooks/cursor', connector: 'cursor' },
];

export async function registerClaudeCodeRoute(
  app: FastifyInstance,
  options: ClaudeCodeRouteOptions,
): Promise<void> {
  const { configService, policyEngine } = options;
  const hookHandler = options.hookHandler ?? new ClaudeCodeHookHandler();
  const authPreHandler = createWebhookAuthPreHandler(
    configService.localWebhookToken,
  );

  for (const { path, connector } of HOOK_ROUTES) {
    app.post(
      path,
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
            { connector, validationIssues: details },
            'Rejected invalid hook payload',
          );

          return reply.code(400).send({
            status: 'error',
            error: 'INVALID_HOOK_PAYLOAD',
            message: 'Webhook payload failed validation.',
            details,
          });
        }

        const evaluation = policyEngine?.evaluateHook(parseResult.data, connector);
        const receipt = await hookHandler.handleHookPayload(parseResult.data, connector, evaluation);

        if (evaluation && evaluation.decision === 'BLOCK') {
          const reason =
            evaluation.reason ?? 'Blocked by active workspace privacy policy.';

          request.log.warn(
            {
              receiptId: receipt.receiptId,
              eventId: receipt.eventId,
              connector: receipt.connector,
              hookEventName: receipt.hookEventName,
              toolName: receipt.toolName,
              policyId: evaluation.policyId,
              policyName: evaluation.policyName,
              ruleId: evaluation.ruleId,
              matchedValue: evaluation.matchedValue,
              reason,
            },
            'BLOCKED AI tool call by active privacy policy',
          );

          return reply.code(200).send({
            ...receipt,
            status: 'blocked',
            decision: 'block',
            policyId: evaluation.policyId,
            policyName: evaluation.policyName,
            ruleId: evaluation.ruleId,
            reason,
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: reason,
            },
          });
        }

        if (evaluation && evaluation.decision === 'WARN') {
          request.log.warn(
            {
              receiptId: receipt.receiptId,
              eventId: receipt.eventId,
              connector: receipt.connector,
              toolName: receipt.toolName,
              policyName: evaluation.policyName,
              reason: evaluation.reason,
            },
            'Policy warning triggered for AI tool call',
          );
        }

        request.log.info(
          {
            receiptId: receipt.receiptId,
            eventId: receipt.eventId,
            connector: receipt.connector,
            hookEventName: receipt.hookEventName,
            eventType: receipt.eventType,
            category: receipt.category,
            severity: receipt.severity,
            toolName: receipt.toolName,
            sessionId: receipt.sessionId,
          },
          'Accepted and mapped AI tool hook event',
        );

        return reply.code(202).send(receipt);
      },
    );
  }
}
