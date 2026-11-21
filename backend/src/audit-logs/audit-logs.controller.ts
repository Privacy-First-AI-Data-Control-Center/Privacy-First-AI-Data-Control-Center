import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service.js';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { WorkspaceRoleGuard } from '../alert/guard/workspace-role.guard.js';
import { WorkspaceRoles } from '../alert/guard/workspace-roles.decorator.js';
import { Role } from '../user/enum/role.js';
import { QueryAuditLogsDto } from './dto/query-audit-log.dto.js';
import { AuditLogs } from './entities/audit-logs.entity.js';
@ApiTags('Audit Logs')
@Controller('workspace/:workspaceId/audit-logs')
@UseGuards(JwtGuard, WorkspaceRoleGuard)
@WorkspaceRoles(Role.OWNER, Role.ADMIN)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

 @Get()
  async getAllLogs(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Query() query: QueryAuditLogsDto): Promise<AuditLogs[]>{
    return await this.auditLogsService.getAllLogs(workspaceId, query);
  }

  @Get('/:logId')
  async getLogById(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('logId', ParseIntPipe) logId: number): Promise<AuditLogs>{
    return await this.auditLogsService.getLogById(workspaceId, logId);
  }

}