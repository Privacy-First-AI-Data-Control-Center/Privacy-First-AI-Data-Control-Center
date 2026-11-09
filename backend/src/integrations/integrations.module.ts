import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsService } from './integrations.service.js';
import { IntegrationsController } from './integrations.controller.js';
import { Integrations } from './entities/integration.entity.js';
import { IntegrationCapabilities } from './entities/integration-capability.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Integrations ,IntegrationCapabilities])],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService, TypeOrmModule],
})
export class IntegrationsModule {}
