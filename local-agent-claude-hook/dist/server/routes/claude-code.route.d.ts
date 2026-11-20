import type { FastifyInstance } from 'fastify';
import { ConfigService } from '../../config/config.service.js';
import { ClaudeCodeHookHandler } from '../../connectors/claude-code/hook-handler.js';
export interface ClaudeCodeRouteOptions {
    configService: ConfigService;
    hookHandler?: ClaudeCodeHookHandler;
}
export declare function registerClaudeCodeRoute(app: FastifyInstance, options: ClaudeCodeRouteOptions): Promise<void>;
