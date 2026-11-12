import { Module } from '@nestjs/common';
import { ExportService } from './export.service.js';
import { ExportController } from './export.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportJobs } from './entities/export.entity.js';
import { Events } from '../events/entities/event.entity.js';
import { Workspaces } from '../workspace/entity/workspaces.js';
import { WorkspaceMembers } from '../workspace-member/entity/workspace-members.js';
import { ExportJobService } from './export-job.service.js';

@Module({
  imports:[TypeOrmModule.forFeature([ExportJobs, Events, Workspaces, WorkspaceMembers])],
  controllers: [ExportController],
  providers: [ExportService, ExportJobService],
})
export class ExportModule {}
