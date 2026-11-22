import { createHash } from 'node:crypto';
import { hostname, platform, release } from 'node:os';
function sha256Hex(input) {
    return createHash('sha256').update(input, 'utf8').digest('hex');
}
/**
 * Manages device-bound agent identity and authentication headers for `/api/v1/agent/*` routes.
 * Keeps machine-to-machine `AgentCredential` strictly separate from browser user JWT sessions (Section 9.2).
 */
export class AgentAuthService {
    deviceId;
    credentialToken;
    enrollmentState;
    osPlatform;
    osVersion;
    hostnameHash;
    constructor(options = {}) {
        this.deviceId = options.deviceId?.trim() || 'local-unregistered-device';
        const initialToken = options.credentialToken?.trim() || null;
        this.credentialToken = initialToken;
        this.enrollmentState = initialToken ? 'ENROLLED' : 'UNENROLLED';
        this.osPlatform = platform();
        this.osVersion = release();
        this.hostnameHash = sha256Hex(hostname());
    }
    isAuthenticated() {
        return (this.enrollmentState === 'ENROLLED' &&
            this.credentialToken !== null &&
            this.credentialToken.length > 0);
    }
    isRevoked() {
        return this.enrollmentState === 'REVOKED';
    }
    getEnrollmentState() {
        return this.enrollmentState;
    }
    getDeviceId() {
        return this.deviceId;
    }
    getIdentityContext() {
        return {
            deviceId: this.deviceId,
            credentialToken: this.credentialToken,
            enrollmentState: this.enrollmentState,
            platform: this.osPlatform,
            osVersion: this.osVersion,
            hostnameHash: this.hostnameHash,
        };
    }
    /**
     * Stores the newly issued deviceId and device-bound credential after
     * `POST /api/v1/agent/enrollments/complete` succeeds.
     */
    setEnrolledCredentials(params) {
        const trimmedDeviceId = params.deviceId.trim();
        const trimmedToken = params.credentialToken.trim();
        if (!trimmedDeviceId || !trimmedToken) {
            throw new Error('Both deviceId and credentialToken are required to complete enrollment.');
        }
        this.deviceId = trimmedDeviceId;
        this.credentialToken = trimmedToken;
        this.enrollmentState = 'ENROLLED';
    }
    /**
     * Marks the agent credential as revoked when the backend responds with 401/403
     * indicating device revocation (`POST /workspaces/:workspaceId/devices/:deviceId/revoke`).
     */
    markCredentialRevoked() {
        this.credentialToken = null;
        this.enrollmentState = 'REVOKED';
    }
    /**
     * Builds HTTP headers for authenticated `/api/v1/agent/*` backend calls.
     */
    getAuthHeaders() {
        if (!this.isAuthenticated() || !this.credentialToken) {
            throw new Error(`Agent is not enrolled (state=${this.enrollmentState}). Complete enrollment before calling authenticated /agent/* endpoints.`);
        }
        return {
            Authorization: `Bearer ${this.credentialToken}`,
            'x-agent-device-id': this.deviceId,
        };
    }
}
//# sourceMappingURL=agent-auth.service.js.map