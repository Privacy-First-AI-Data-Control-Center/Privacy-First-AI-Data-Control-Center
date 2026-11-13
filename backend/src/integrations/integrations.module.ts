import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsService } from './integrations.service.js';
import { IntegrationsController } from './integrations.controller.js';
import { Integrations } from './entities/integration.entity.js';
import { IntegrationCapabilities } from './entities/integration-capability.entity.js';
import { ConnectorTypes } from '../connectors/entities/connector.entity.js';
import { Workspaces } from '../workspace/entity/workspaces.js';
import { ConnectorsModule } from '../connectors/connectors.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Integrations ,IntegrationCapabilities ,ConnectorTypes,Workspaces]),ConnectorsModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService, TypeOrmModule],
})
export class IntegrationsModule {}
