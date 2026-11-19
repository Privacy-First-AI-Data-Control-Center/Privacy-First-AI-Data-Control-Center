import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devices } from '../device/entity/devices.js';
import { Integrations } from '../integrations/entities/integration.entity.js';
import { ConnectorTypes } from '../connectors/entities/connector.entity.js';
import { Events } from '../events/entities/event.entity.js';
import { Policies } from '../policy/entities/policy.entity.js';
import { Alerts } from '../alert/entities/alerts.entity.js';
import { Reports } from '../reports/entities/report.entity.js';
import { MonitoringSearchController } from './monitoring-search.controller.js';
import { MonitoringSearchService } from './monitoring-search.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Devices,
      Integrations,
      ConnectorTypes,
      Events,
      Policies,
      Alerts,
      Reports,
    ]),
  ],
  controllers: [MonitoringSearchController],
  providers: [MonitoringSearchService],
  exports: [MonitoringSearchService],
})
export class MonitoringSearchModule {}
