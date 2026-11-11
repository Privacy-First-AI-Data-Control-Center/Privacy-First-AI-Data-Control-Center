import { Module } from '@nestjs/common';
import { DeletionRequestsService } from './deletion-requests.service.js';
import { DeletionRequestsController } from './deletion-requests.controller.js';
import { WorkspaceMembers } from '../workspace-member/entity/workspace-members.js';
import { Workspaces } from '../workspace/entity/workspaces.js';
import { Events } from '../events/entities/event.entity.js';
import { DeletionRequests } from './entities/deletion-requests.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeletionJobService } from './deletion-job.service.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([DeletionRequests, Events, Workspaces, WorkspaceMembers])],
  controllers: [DeletionRequestsController],
  providers: [DeletionRequestsService, DeletionJobService],
})
export class DeletionRequestsModule {}
