export interface HealthStatusPayload {
  status: 'ok';
  service: 'local-agent-claude-hook';
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

export class HealthService {
  private readonly serviceName = 'local-agent-claude-hook' as const;
  private readonly version: string;

  constructor(version = '1.0.0') {
    this.version = version;
  } 

  public getHealthStatus(): HealthStatusPayload {
    return{
      status: 'ok',
      service: this.serviceName,
      version: this.version,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
