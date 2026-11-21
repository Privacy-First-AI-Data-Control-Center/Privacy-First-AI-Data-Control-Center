import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';
import { MonitoringSearchService } from './monitoring-search.service.js';
import { GlobalSearchDto } from './dto/global-search.dto.js';

@ApiTags('Monitoring Coverage & Search (M4)')
@UseGuards(JwtGuard, RolesGuard)
@Controller('workspaces/:workspaceId')
export class MonitoringSearchController {
  constructor(private readonly service: MonitoringSearchService) {}

  @ApiOperation({ summary: 'View overall monitoring coverage and gaps for a workspace' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Get('monitoring/coverage')
  async getWorkspaceCoverage(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
  ) {
    return this.service.getWorkspaceCoverage(workspaceId);
  }

  @ApiOperation({ summary: 'View monitoring coverage for a single device (by ID or deviceName)' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Get('monitoring/coverage/:deviceId')
  async getDeviceCoverage(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('deviceId') deviceId: string,
  ) {
    return this.service.getDeviceCoverage(workspaceId, deviceId);
  }

  @ApiOperation({ summary: 'Search across workspace events, policies, integrations, alerts, and reports' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @Get('search')
  async globalSearch(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Query() query: GlobalSearchDto,
  ) {
    return this.service.globalSearch(workspaceId, query);
  }
}
