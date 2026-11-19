import { createHash } from 'node:crypto';
import { hostname, platform, release } from 'node:os';

export type AgentEnrollmentState =
  | 'UNENROLLED'
  | 'ENROLLED'
  | 'REVOKED';

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

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Manages device-bound agent identity and authentication headers for `/api/v1/agent/*` routes.
 * Keeps machine-to-machine `AgentCredential` strictly separate from browser user JWT sessions (Section 9.2).
 */
export class AgentAuthService {
  private deviceId: string;
  private credentialToken: string | null;
  private enrollmentState: AgentEnrollmentState;
  private readonly osPlatform: string;
  private readonly osVersion: string;
  private readonly hostnameHash: string;

  constructor(options: AgentAuthServiceOptions = {}) {
    this.deviceId = options.deviceId?.trim() || 'local-unregistered-device';
    const initialToken = options.credentialToken?.trim() || null;
    this.credentialToken = initialToken;
    this.enrollmentState = initialToken ? 'ENROLLED' : 'UNENROLLED';
    this.osPlatform = platform();
    this.osVersion = release();
    this.hostnameHash = sha256Hex(hostname());
  }

  public isAuthenticated(): boolean {
    return (
      this.enrollmentState === 'ENROLLED' &&
      this.credentialToken !== null &&
      this.credentialToken.length > 0
    );
  }

  public isRevoked(): boolean {
    return this.enrollmentState === 'REVOKED';
  }

  public getEnrollmentState(): AgentEnrollmentState {
    return this.enrollmentState;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public getIdentityContext(): AgentIdentityContext {
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
  public setEnrolledCredentials(params: {
    deviceId: string;
    credentialToken: string;
  }): void {
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
  public markCredentialRevoked(): void {
    this.credentialToken = null;
    this.enrollmentState = 'REVOKED';
  }

  /**
   * Builds HTTP headers for authenticated `/api/v1/agent/*` backend calls.
   */
  public getAuthHeaders(): Record<string, string> {
    if (!this.isAuthenticated() || !this.credentialToken) {
      throw new Error(
        `Agent is not enrolled (state=${this.enrollmentState}). Complete enrollment before calling authenticated /agent/* endpoints.`,
      );
    }

    return {
      Authorization: `Bearer ${this.credentialToken}`,
      'x-agent-device-id': this.deviceId,
    };
  }
}
