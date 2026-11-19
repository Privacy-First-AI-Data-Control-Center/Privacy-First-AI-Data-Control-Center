import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { MonitoringSearchService } from './monitoring-search.service.js';
import { GlobalSearchDto } from './dto/global-search.dto.js';

@ApiTags('Monitoring Coverage & Search (M4)')
@UseGuards(JwtGuard)
@Controller('workspaces/:workspaceId')
export class MonitoringSearchController {
  constructor(private readonly service: MonitoringSearchService) {}

  @ApiOperation({ summary: 'View overall monitoring coverage and gaps for a workspace' })
  @Get('monitoring/coverage')
  async getWorkspaceCoverage(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
  ) {
    return this.service.getWorkspaceCoverage(workspaceId);
  }

  @ApiOperation({ summary: 'View monitoring coverage for a single device (by ID or deviceName)' })
  @Get('monitoring/coverage/:deviceId')
  async getDeviceCoverage(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('deviceId') deviceId: string,
  ) {
    return this.service.getDeviceCoverage(workspaceId, deviceId);
  }

  @ApiOperation({ summary: 'Search across workspace events, policies, integrations, alerts, and reports' })
  @Get('search')
  async globalSearch(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Query() query: GlobalSearchDto,
  ) {
    return this.service.globalSearch(workspaceId, query);
  }
}
