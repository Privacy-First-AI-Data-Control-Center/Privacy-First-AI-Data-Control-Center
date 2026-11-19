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
import { Devices } from '../device/entity/devices.js';
import { ConnectorTypes } from '../connectors/entities/connector.entity.js';
import { PolicyDecision } from '../policy-decision/entities/policy-decision.entity.js';
import { EnforcementAction } from '../enforcement-action/entities/enforcement-action.entity.js';
import { PolicyVersions } from '../policy/entities/policy-version.entity.js';

@Module({
  imports:[TypeOrmModule.forFeature([Events ,EventTypes,EventSources,EventAttributes ,Workspaces ,Integrations, Devices, ConnectorTypes, PolicyDecision, EnforcementAction, PolicyVersions])],
  controllers: [EventsController],
  providers: [EventsService],
  exports:[TypeOrmModule ,EventsService],
})
export class EventsModule {}
