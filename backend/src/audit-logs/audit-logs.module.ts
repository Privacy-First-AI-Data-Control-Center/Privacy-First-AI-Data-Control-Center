import { Global, Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service.js';
import { AuditLogsController } from './audit-logs.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogs } from './entities/audit-logs.entity.js';
import { Workspaces } from '../workspace/entity/workspaces.js';
import { WorkspaceMembers } from '../workspace-member/entity/workspace-members.js';
import { EmailModule } from '../email/email.module.js';
@Global()
@Module({
   imports: [TypeOrmModule.forFeature([AuditLogs, Workspaces, WorkspaceMembers])],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
   exports: [AuditLogsService]
})
export class AuditLogsModule {}
