import type { BackendClient } from '../backend/backend-client.js';
import type { ConnectorSlug } from '../connectors/claude-code/event-mapper.js';
import type { ClaudeCodeHookPayload } from '../connectors/claude-code/hook-handler.js';
export type PolicyRuleEffect = 'ALLOW' | 'WARN' | 'REQUIRE_APPROVAL' | 'REDACT' | 'BLOCK';
export interface ActivePolicyRule {
    id: number;
    ruleType: string;
    condition: Record<string, unknown>;
    effect: PolicyRuleEffect;
    actionConfig?: Record<string, unknown> | null;
    enabled: boolean;
    position: number;
}
export interface ActivePolicyRecord {
    id: number;
    workspaceId?: number;
    name: string;
    description?: string | null;
    priority: number;
    status: string;
    policyVersionId?: number | null;
    versionNumber?: number | null;
    rules: ActivePolicyRule[];
}
export interface PolicyEvaluationResult {
    decision: 'ALLOW' | 'WARN' | 'BLOCK';
    policyId: number | null;
    policyVersionId: number | null;
    policyName: string | null;
    ruleId: number | null;
    reason: string | null;
    matchedValue: string | null;
}
export declare class PolicyEngineService {
    private policies;
    private lastSyncedAt;
    private readonly backendClient?;
    constructor(options?: {
        backendClient?: BackendClient;
    });
    getCachedPolicies(): {
        lastSyncedAt: string | null;
        total: number;
        policies: ActivePolicyRecord[];
    };
    setPolicies(policies: ActivePolicyRecord[]): void;
    syncFromBackend(): Promise<{
        ok: boolean;
        total: number;
        errorMessage: string | null;
    }>;
    /**
     * Evaluates a PreToolUse hook payload against cached active policies in < 5ms.
     */
    evaluateHook(payload: ClaudeCodeHookPayload, connectorSlug: ConnectorSlug): PolicyEvaluationResult;
    private matchRule;
}
