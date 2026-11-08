import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service.js';
import { IntegrationsController } from './integrations.controller.js';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
