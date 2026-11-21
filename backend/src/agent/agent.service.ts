import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AgentInstallations } from './entity/agent-installations.js';
import { Repository } from 'typeorm';
import { CreateAgentInstallationDto } from './dto/create-agent-installation.dto.js';
import { CompleteEnrollmentDto } from './dto/complete-enrollment.dto.js';
import { AgentHeartbeatDto } from './dto/agent-heartbeat.dto.js';
import { AgentDiagnosticsDto } from './dto/agent-diagnostics.dto.js';
import { Integrations } from '../integrations/entities/integration.entity.js';
import { Policies } from '../policy/entities/policy.entity.js';
import { PolicyVersions } from '../policy/entities/policy-version.entity.js';
import { ConnectorsService } from '../connectors/connectors.service.js';
import { IntegrationStatus } from '../integrations/enum/integration-status.js';
import { PolicyStatus } from '../policy/enums/policy-status.enum.js';
import { AgentStatus } from './enum/agent-status.js';
import { Devices } from '../device/entity/devices.js';
import { DeviceStatus } from '../device/enum/device-status.js';

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(AgentInstallations)
    private readonly agentInstallationRepo: Repository<AgentInstallations>,
    @InjectRepository(Integrations)
    private readonly integrationRepo: Repository<Integrations>,
    @InjectRepository(Policies)
    private readonly policyRepo: Repository<Policies>,
    @InjectRepository(PolicyVersions)
    private readonly policyVersionRepo: Repository<PolicyVersions>,
    @InjectRepository(Devices)
    private readonly deviceRepo: Repository<Devices>,
    private readonly connectorsService: ConnectorsService,
  ) {}

  async getAgentList(deviceId: string): Promise<AgentInstallations[]> {
    return this.agentInstallationRepo.find({
      where: {
        device: {
          id: parseInt(deviceId),
        },
      },
    });
  }

  async enrollAgent(createAgentInstallationDto: CreateAgentInstallationDto): Promise<any> {
    try {
      const agentInfo = await this.agentInstallationRepo.create({
        ...createAgentInstallationDto,
        device: { id: createAgentInstallationDto.deviceId },
      });

      const agent = await this.agentInstallationRepo.save(agentInfo);

      if (agent != null) {
        return 'Agent enrolled successfully';
      } else {
        return 'Failed to enroll agent';
      }
    } catch {
      throw new BadRequestException('Failed to add member');
    }
  }

  // --- Member 1: Agent Lifecycle & Diagnostics Operations ---

  async completeEnrollment(dto: CompleteEnrollmentDto) {
    const device = await this.deviceRepo.findOne({
      where: { id: dto.deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${dto.deviceId} not found`);
    }

    if (device.deviceStatus === DeviceStatus.REVOKED) {
      throw new ForbiddenException('Cannot complete enrollment for a revoked device');
    }

    let agent = await this.agentInstallationRepo.findOne({
      where: { installationId: dto.installationId },
    });

    if (agent) {
      agent.agentVersion = dto.agentVersion;
      agent.agentStatus = AgentStatus.ACTIVE;
      agent.lastHeartbeatAt = new Date();
      agent = await this.agentInstallationRepo.save(agent);
    } else {
      agent = this.agentInstallationRepo.create({
        installationId: dto.installationId,
        agentVersion: dto.agentVersion,
        agentStatus: AgentStatus.ACTIVE,
        device: { id: dto.deviceId } as Devices,
        installedAt: new Date(),
        lastHeartbeatAt: new Date(),
      });
      agent = await this.agentInstallationRepo.save(agent);
    }

    device.lastSeenAt = new Date();
    device.deviceStatus = DeviceStatus.ACTIVE;
    if (dto.platform) device.platform = dto.platform;
    if (dto.osVersion) device.osVersion = dto.osVersion;
    if (dto.hostName) device.hostName = dto.hostName;
    await this.deviceRepo.save(device);

    return {
      success: true,
      message: 'Agent enrollment completed successfully',
      installationId: agent.installationId,
      agentStatus: agent.agentStatus,
      deviceId: device.id,
      enrolledAt: agent.installedAt,
    };
  }

  async recordHeartbeat(dto: AgentHeartbeatDto) {
    const agent = await this.agentInstallationRepo.findOne({
      where: { installationId: dto.installationId },
      relations: { device: true },
    });

    if (!agent) {
      throw new NotFoundException(`Agent installation with ID ${dto.installationId} not found`);
    }

    if (agent.agentStatus === AgentStatus.REVOKED || agent.device?.deviceStatus === DeviceStatus.REVOKED) {
      return {
        acknowledged: false,
        status: AgentStatus.REVOKED,
        command: 'SHUTDOWN',
        serverTime: new Date().toISOString(),
        message: 'Device or agent credential has been revoked',
      };
    }

    agent.lastHeartbeatAt = new Date();
    if (agent.agentStatus !== AgentStatus.ACTIVE) {
      agent.agentStatus = AgentStatus.ACTIVE;
    }
    if (dto.agentVersion) {
      agent.agentVersion = dto.agentVersion;
    }
    await this.agentInstallationRepo.save(agent);

    if (agent.device) {
      agent.device.lastSeenAt = new Date();
      await this.deviceRepo.save(agent.device);
    }

    return {
      acknowledged: true,
      status: agent.agentStatus,
      serverTime: new Date().toISOString(),
    };
  }

  async getAgentConfig(deviceId?: number, installationId?: string) {
    let device: Devices | null = null;
    if (deviceId) {
      device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    } else if (installationId) {
      const agent = await this.agentInstallationRepo.findOne({
        where: { installationId },
        relations: { device: true },
      });
      device = agent?.device ?? null;
    }

    return {
      syncedAt: new Date().toISOString(),
      deviceId: device?.id ?? deviceId ?? null,
      deviceName: device?.deviceName ?? null,
      deviceStatus: device?.deviceStatus ?? null,
      installationId: installationId ?? null,
      polling: {
        heartbeatIntervalSeconds: 30,
        policySyncIntervalSeconds: 60,
        connectorSyncIntervalSeconds: 120,
      },
      telemetry: {
        batchSize: 50,
        flushIntervalSeconds: 5,
        maxQueueSize: 1000,
      },
      redaction: {
        enabled: true,
        maskSecrets: true,
      },
      endpoints: {
        heartbeat: '/api/v1/agent/heartbeat',
        diagnostics: '/api/v1/agent/diagnostics',
        connectors: '/api/v1/agent/connectors',
        policies: '/api/v1/agent/policies/active',
        eventsBatch: '/api/v1/agent/events/batch',
        enforcementResults: '/api/v1/agent/enforcement-results',
      },
    };
  }

  async recordDiagnostics(dto: AgentDiagnosticsDto) {
    const agent = await this.agentInstallationRepo.findOne({
      where: { installationId: dto.installationId },
      relations: { device: true },
    });

    if (!agent) {
      throw new NotFoundException(`Agent installation with ID ${dto.installationId} not found`);
    }

    agent.lastHeartbeatAt = new Date();
    await this.agentInstallationRepo.save(agent);

    if (agent.device) {
      agent.device.lastSeenAt = new Date();
      await this.deviceRepo.save(agent.device);
    }

    return {
      success: true,
      message: 'Agent diagnostics recorded successfully',
      receivedAt: new Date().toISOString(),
      installationId: agent.installationId,
      level: dto.level ?? 'INFO',
    };
  }

  // --- Member 2: Agent Sync Operations ---

  async getAgentConnectorsConfig(workspaceId?: number, deviceId?: string) {
    const connectorTypes = await this.connectorsService.findAll();

    const supportedConnectors = await Promise.all(
      connectorTypes.map(async (connector) => {
        const { capabilities } = await this.connectorsService.getCapabilities(connector.id);
        return {
          id: connector.id,
          slug: connector.slug,
          displayName: connector.displayName,
          vendor: connector.vendor,
          documentationUrl: connector.documentationUrl,
          capabilities,
        };
      }),
    );

    const activeIntegrations = await this.integrationRepo.find({
      where: {
        status: IntegrationStatus.ACTIVE,
        ...(workspaceId !== undefined ? { workspace: { id: workspaceId } } : {}),
        ...(deviceId !== undefined ? { deviceId } : {}),
      },
      relations: {
        connectorType: true,
        capabilities: true,
      },
      order: { id: 'ASC' },
    });

    return {
      syncedAt: new Date().toISOString(),
      supportedConnectors,
      configuredIntegrations: activeIntegrations,
    };
  }

  async getActivePolicies(workspaceId?: number) {
    const activePolicies = await this.policyRepo.find({
      where: {
        status: PolicyStatus.ACTIVE,
        ...(workspaceId !== undefined ? { workspace: { id: workspaceId } } : {}),
      },
      relations: {
        workspace: true,
      },
      order: {
        priority: 'DESC',
        createdAt: 'DESC',
      },
    });

    const policiesWithRules = await Promise.all(
      activePolicies.map(async (policy) => {
        const latestVersion = await this.policyVersionRepo.findOne({
          where: { policy: { id: policy.id } },
          relations: { policy_rules: true },
          order: {
            versionNumber: 'DESC',
            policy_rules: { position: 'ASC' },
          },
        });

        return {
          id: policy.id,
          workspaceId: policy.workspace?.id,
          name: policy.name,
          description: policy.description,
          priority: policy.priority,
          status: policy.status,
          policyVersionId: latestVersion?.id ?? null,
          versionNumber: latestVersion?.versionNumber ?? null,
          definitionSnapshot: latestVersion?.definitionSnapshot ?? null,
          rules: (latestVersion?.policy_rules ?? []).filter((rule) => rule.enabled),
          updatedAt: policy.updatedAt,
        };
      }),
    );

    return {
      syncedAt: new Date().toISOString(),
      total: policiesWithRules.length,
      policies: policiesWithRules,
    };
  }

  async revokeDeviceAgents(deviceId: number): Promise<void> {
    await this.agentInstallationRepo.update(
      { device: { id: deviceId } },
      { agentStatus: AgentStatus.REVOKED },
    );
  }
}
