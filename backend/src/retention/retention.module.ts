import { Module } from '@nestjs/common';
import { RetentionService } from './retention.service.js';
import { RetentionController } from './retention.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetentionSettings } from './entities/retention-settings.entity.js';
import { Alerts } from '../alert/entities/alerts.entity.js';
import { Events } from '../events/entities/event.entity.js';
import { Workspaces } from '../workspace/entity/workspaces.js';
import { WorkspaceMembers } from '../workspace-member/entity/workspace-members.js';
import { RetentionJobService } from './retention-job.service.js';

@Module({
  imports:[TypeOrmModule.forFeature([RetentionSettings, Alerts, Events, Workspaces, WorkspaceMembers])],
  controllers: [RetentionController],
  providers: [RetentionService, RetentionJobService],
})
export class RetentionModule {}
