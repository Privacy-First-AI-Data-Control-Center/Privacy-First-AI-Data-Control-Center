import { ClaudeCodeEventMapper, type ConfidenceLevel, type ConnectorSlug, type MappedClaudeCodeEvent } from './event-mapper.js';
import type { ClaudeCodeHookPayload } from './hook-handler.js';
export interface ConnectorCapabilityDescriptor {
    capabilityCode: string;
    availability: ConfidenceLevel;
    evidenceSource: string;
    supportsEnforcement: boolean;
    description: string;
}
export interface ConnectorMetadata {
    slug: 'claude-code';
    displayName: string;
    vendor: string;
    version: string;
    integrationMethod: 'native_http_hooks';
    capabilities: readonly ConnectorCapabilityDescriptor[];
    knownLimitations: readonly string[];
}
export declare class ClaudeCodeConnectorService {
    private readonly eventMapper;
    private readonly version;
    constructor(options?: {
        version?: string;
        eventMapper?: ClaudeCodeEventMapper;
    });
    getConnectorMetadata(): ConnectorMetadata;
    normalizeHookPayload(payload: ClaudeCodeHookPayload, connectorSlug?: ConnectorSlug): MappedClaudeCodeEvent;
}
