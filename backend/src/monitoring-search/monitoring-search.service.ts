import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Devices } from '../device/entity/devices.js';
import { DeviceStatus } from '../device/enum/device-status.js';
import { Integrations } from '../integrations/entities/integration.entity.js';
import { IntegrationStatus } from '../integrations/enum/integration-status.js';
import { ConnectorTypes } from '../connectors/entities/connector.entity.js';
import { Events } from '../events/entities/event.entity.js';
import { Policies } from '../policy/entities/policy.entity.js';
import { Alerts } from '../alert/entities/alerts.entity.js';
import { Reports } from '../reports/entities/report.entity.js';
import { GlobalSearchDto } from './dto/global-search.dto.js';

@Injectable()
export class MonitoringSearchService {
  constructor(
    @InjectRepository(Devices)
    private readonly deviceRepo: Repository<Devices>,
    @InjectRepository(Integrations)
    private readonly integrationRepo: Repository<Integrations>,
    @InjectRepository(ConnectorTypes)
    private readonly connectorTypeRepo: Repository<ConnectorTypes>,
    @InjectRepository(Events)
    private readonly eventRepo: Repository<Events>,
    @InjectRepository(Policies)
    private readonly policyRepo: Repository<Policies>,
    @InjectRepository(Alerts)
    private readonly alertRepo: Repository<Alerts>,
    @InjectRepository(Reports)
    private readonly reportRepo: Repository<Reports>,
  ) {}

  /**
   * GET /api/v1/workspaces/:workspaceId/monitoring/coverage
   * Returns workspace-wide monitoring coverage, active connectors, and visibility gaps.
   */
  async getWorkspaceCoverage(workspaceId: number) {
    const [devices, integrations, connectorTypes] = await Promise.all([
      this.deviceRepo.find({
        where: { workspace: { id: workspaceId } },
        order: { lastSeenAt: 'DESC' },
      }),
      this.integrationRepo.find({
        where: { workspace: { id: workspaceId } },
        relations: { connectorType: true, capabilities: true },
        order: { id: 'ASC' },
      }),
      this.connectorTypeRepo.find({ order: { id: 'ASC' } }),
    ]);

    const now = Date.now();
    const staleThresholdMs = 24 * 60 * 60 * 1000;

    const activeIntegrations = integrations.filter(
      (i) => i.status === IntegrationStatus.ACTIVE,
    );
    const connectedSlugs = new Set(
      activeIntegrations.map((i) => i.connectorType?.slug).filter(Boolean),
    );

    const gaps: Array<{ type: string; severity: string; target: string; message: string }> = [];

    for (const ct of connectorTypes) {
      if (!connectedSlugs.has(ct.slug)) {
        gaps.push({
          type: 'UNCONNECTED_CONNECTOR',
          severity: 'LOW',
          target: ct.slug,
          message: `${ct.displayName} (${ct.slug}) is not connected in this workspace.`,
        });
      }
    }

    const deviceBreakdown = await Promise.all(
      devices.map(async (device) => {
        const deviceIntegrations = integrations.filter(
          (i) => i.deviceId === device.deviceName,
        );
        const activeDeviceIntegrations = deviceIntegrations.filter(
          (i) => i.status === IntegrationStatus.ACTIVE,
        );
        const isStale =
          !device.lastSeenAt ||
          now - new Date(device.lastSeenAt).getTime() > staleThresholdMs;

        if (activeDeviceIntegrations.length === 0) {
          gaps.push({
            type: 'UNMONITORED_DEVICE',
            severity: 'HIGH',
            target: device.deviceName,
            message: `Device "${device.deviceName}" has no active AI connector integration.`,
          });
        } else if (isStale) {
          gaps.push({
            type: 'STALE_DEVICE',
            severity: 'MEDIUM',
            target: device.deviceName,
            message: `Device "${device.deviceName}" has not reported telemetry in over 24 hours.`,
          });
        }

        const eventCount = await this.eventRepo.count({
          where: {
            workspace: { id: workspaceId },
            deviceId: device.deviceName,
          },
        });

        const covered =
          device.deviceStatus === DeviceStatus.ACTIVE &&
          activeDeviceIntegrations.length > 0 &&
          !isStale;

        return {
          id: device.id,
          deviceName: device.deviceName,
          platform: device.platform,
          status: device.deviceStatus,
          lastSeenAt: device.lastSeenAt,
          isStale,
          covered,
          activeConnectors: activeDeviceIntegrations.map((i) => ({
            integrationId: i.id,
            slug: i.connectorType?.slug ?? 'unknown',
            displayName: i.connectorType?.displayName ?? i.displayName,
            status: i.status,
          })),
          totalEvents: eventCount,
        };
      }),
    );

    const coveredDevicesCount = deviceBreakdown.filter((d) => d.covered).length;
    const coveragePercentage =
      devices.length > 0
        ? Math.round((coveredDevicesCount / devices.length) * 100)
        : 0;

    return {
      workspaceId,
      calculatedAt: new Date().toISOString(),
      summary: {
        totalDevices: devices.length,
        activeDevices: devices.filter((d) => d.deviceStatus === DeviceStatus.ACTIVE).length,
        coveredDevices: coveredDevicesCount,
        coveragePercentage,
        totalSupportedConnectors: connectorTypes.length,
        connectedConnectors: connectedSlugs.size,
        activeIntegrations: activeIntegrations.length,
        totalGaps: gaps.length,
      },
      devices: deviceBreakdown,
      gaps,
    };
  }

  /**
   * GET /api/v1/workspaces/:workspaceId/monitoring/coverage/:deviceId
   * Accepts either numeric Devices.id or string Devices.deviceName.
   */
  async getDeviceCoverage(workspaceId: number, deviceIdParam: string) {
    const numericId = Number(deviceIdParam);
    const device = await this.deviceRepo.findOne({
      where:
        Number.isInteger(numericId) && numericId > 0
          ? [
              { id: numericId, workspace: { id: workspaceId } },
              { deviceName: deviceIdParam, workspace: { id: workspaceId } },
            ]
          : { deviceName: deviceIdParam, workspace: { id: workspaceId } },
    });

    if (!device) {
      throw new NotFoundException(
        `Device "${deviceIdParam}" not found in workspace ${workspaceId}`,
      );
    }

    const [integrations, connectorTypes, totalEvents, highSeverityEvents] =
      await Promise.all([
        this.integrationRepo.find({
          where: {
            workspace: { id: workspaceId },
            deviceId: device.deviceName,
          },
          relations: { connectorType: true, capabilities: true },
          order: { id: 'ASC' },
        }),
        this.connectorTypeRepo.find({ order: { id: 'ASC' } }),
        this.eventRepo.count({
          where: { workspace: { id: workspaceId }, deviceId: device.deviceName },
        }),
        this.eventRepo.count({
          where: {
            workspace: { id: workspaceId },
            deviceId: device.deviceName,
            severity: 'high',
          },
        }),
      ]);

    const activeIntegrations = integrations.filter(
      (i) => i.status === IntegrationStatus.ACTIVE,
    );
    const connectedSlugs = new Set(
      activeIntegrations.map((i) => i.connectorType?.slug).filter(Boolean),
    );
    const missingConnectors = connectorTypes
      .filter((ct) => !connectedSlugs.has(ct.slug))
      .map((ct) => ({ slug: ct.slug, displayName: ct.displayName }));

    const isStale =
      !device.lastSeenAt ||
      Date.now() - new Date(device.lastSeenAt).getTime() > 24 * 60 * 60 * 1000;

    const connectorCoveragePct =
      connectorTypes.length > 0
        ? Math.round((connectedSlugs.size / connectorTypes.length) * 100)
        : 0;

    return {
      workspaceId,
      device: {
        id: device.id,
        deviceName: device.deviceName,
        hostName: device.hostName,
        platform: device.platform,
        osVersion: device.osVersion,
        status: device.deviceStatus,
        lastSeenAt: device.lastSeenAt,
        isStale,
      },
      coverage: {
        isMonitored:
          device.deviceStatus === DeviceStatus.ACTIVE &&
          activeIntegrations.length > 0 &&
          !isStale,
        connectorCoveragePercentage: connectorCoveragePct,
        activeIntegrationsCount: activeIntegrations.length,
        totalEvents,
        highSeverityEvents,
      },
      integrations: integrations.map((i) => ({
        id: i.id,
        displayName: i.displayName,
        connectorSlug: i.connectorType?.slug ?? 'unknown',
        status: i.status,
        version: i.version,
        connectedAt: i.connectedAt,
        capabilitiesCount: i.capabilities?.length ?? 0,
      })),
      missingConnectors,
    };
  }

  /**
   * GET /api/v1/workspaces/:workspaceId/search?q=...&type=all&limit=10
   * Global workspace-scoped search across events, policies, integrations, alerts, and reports.
   */
  async globalSearch(workspaceId: number, dto: GlobalSearchDto) {
    const q = dto.q.trim();
    const pattern = `%${q}%`;
    const scope = dto.type ?? 'all';
    const limit = dto.limit ?? 10;

    const shouldSearch = (target: string) => scope === 'all' || scope === target;

    const [events, policies, integrations, alerts, reports] = await Promise.all([
      shouldSearch('events')
        ? this.eventRepo.find({
            where: [
              { workspace: { id: workspaceId }, summary: ILike(pattern) },
              { workspace: { id: workspaceId }, deviceId: ILike(pattern) },
            ],
            select: {
              id: true,
              eventId: true,
              deviceId: true,
              severity: true,
              summary: true,
              occurredAt: true,
            },
            order: { occurredAt: 'DESC' },
            take: limit,
          })
        : Promise.resolve([]),

      shouldSearch('policies')
        ? this.policyRepo.find({
            where: [
              { workspace: { id: workspaceId }, name: ILike(pattern) },
              { workspace: { id: workspaceId }, description: ILike(pattern) },
            ],
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              priority: true,
              updatedAt: true,
            },
            order: { priority: 'DESC' },
            take: limit,
          })
        : Promise.resolve([]),

      shouldSearch('integrations')
        ? this.integrationRepo.find({
            where: [
              { workspace: { id: workspaceId }, displayName: ILike(pattern) },
              { workspace: { id: workspaceId }, deviceId: ILike(pattern) },
            ],
            relations: { connectorType: true },
            order: { id: 'DESC' },
            take: limit,
          })
        : Promise.resolve([]),

      shouldSearch('alerts')
        ? this.alertRepo.find({
            where: { workspaceId, title: ILike(pattern) },
            select: {
              id: true,
              title: true,
              alertType: true,
              severity: true,
              status: true,
              createdAt: true,
            },
            order: { createdAt: 'DESC' },
            take: limit,
          })
        : Promise.resolve([]),

      shouldSearch('reports')
        ? this.reportRepo.find({
            where: { workspaceId, title: ILike(pattern) },
            select: {
              id: true,
              title: true,
              createdAt: true,
              updatedAt: true,
            },
            order: { createdAt: 'DESC' },
            take: limit,
          })
        : Promise.resolve([]),
    ]);

    const mappedIntegrations = integrations.map((i) => ({
      id: i.id,
      displayName: i.displayName,
      deviceId: i.deviceId,
      status: i.status,
      connectorSlug: i.connectorType?.slug ?? null,
    }));

    const totalMatches =
      events.length +
      policies.length +
      mappedIntegrations.length +
      alerts.length +
      reports.length;

    return {
      workspaceId,
      query: q,
      type: scope,
      totalMatches,
      results: {
        events,
        policies,
        integrations: mappedIntegrations,
        alerts,
        reports,
      },
    };
  }
}
