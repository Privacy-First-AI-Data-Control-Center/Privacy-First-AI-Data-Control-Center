export type AgentEnrollmentState = 'UNENROLLED' | 'ENROLLED' | 'REVOKED';
export interface AgentIdentityContext {
    deviceId: string;
    credentialToken: string | null;
    enrollmentState: AgentEnrollmentState;
    platform: string;
    osVersion: string;
    hostnameHash: string;
}
export interface AgentAuthServiceOptions {
    deviceId?: string;
    credentialToken?: string;
}
/**
 * Manages device-bound agent identity and authentication headers for `/api/v1/agent/*` routes.
 * Keeps machine-to-machine `AgentCredential` strictly separate from browser user JWT sessions (Section 9.2).
 */
export declare class AgentAuthService {
    private deviceId;
    private credentialToken;
    private enrollmentState;
    private readonly osPlatform;
    private readonly osVersion;
    private readonly hostnameHash;
    constructor(options?: AgentAuthServiceOptions);
    isAuthenticated(): boolean;
    isRevoked(): boolean;
    getEnrollmentState(): AgentEnrollmentState;
    getDeviceId(): string;
    getIdentityContext(): AgentIdentityContext;
    /**
     * Stores the newly issued deviceId and device-bound credential after
     * `POST /api/v1/agent/enrollments/complete` succeeds.
     */
    setEnrolledCredentials(params: {
        deviceId: string;
        credentialToken: string;
    }): void;
    /**
     * Marks the agent credential as revoked when the backend responds with 401/403
     * indicating device revocation (`POST /workspaces/:workspaceId/devices/:deviceId/revoke`).
     */
    markCredentialRevoked(): void;
    /**
     * Builds HTTP headers for authenticated `/api/v1/agent/*` backend calls.
     */
    getAuthHeaders(): Record<string, string>;
}
