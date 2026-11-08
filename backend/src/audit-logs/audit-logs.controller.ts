import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service.js';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { QueryAuditLogsDto } from './dto/query-audit-log.dto.js';
import { AuditLogs } from './entities/audit-logs.entity.js';
@ApiTags('Audit Logs')
@Controller('workspace/:workspaceId/audit-logs')
@UseGuards(JwtGuard)
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
