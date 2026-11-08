import { Module } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { EventsController } from './events.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Events } from './entities/event.entity.js';
import { EventTypes } from './entities/event-type.entity.js';
import { EventSources } from './entities/event-source.entity.js';
import { EventAttributes } from './entities/event-attribute.entity.js';
import { Workspaces } from '../workspace/entity/workspaces.js';
import { Integrations } from '../integrations/entities/integration.entity.js';

@Module({
  imports:[TypeOrmModule.forFeature([Events ,EventTypes,EventSources,EventAttributes ,Workspaces ,Integrations])],
  controllers: [EventsController],
  providers: [EventsService],
  exports:[TypeOrmModule ,EventsService],
})
export class EventsModule {}
