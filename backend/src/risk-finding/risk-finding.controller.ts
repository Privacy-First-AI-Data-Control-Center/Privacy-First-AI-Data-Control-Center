import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RiskFindingService } from './risk-finding.service.js';
import { QueryRiskFindingDto } from './dto/query-risk-finding.dto.js';
import { RiskFinding } from './entities/risk-finding.entity.js';
import { workerData } from 'worker_threads';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';

@ApiTags('Risk Findings')
@Controller('workspaces/:workspaceId')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
export class RiskFindingController {
  constructor(private readonly riskFindingService: RiskFindingService) {}

  @ApiOperation({ summary: 'List risk findings' })
  @Get('/risk-findings')
  async findAll(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Query()query:QueryRiskFindingDto):Promise<RiskFinding[]>{
    return await this.riskFindingService.findAll(workspaceId,query);
  }

  @ApiOperation({ summary: 'View a risk finding' })
  @Get('/risk-findings/:findingId')
  async findOne(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('findingId',ParseIntPipe)findingId:number):Promise<RiskFinding>{
    return await this.riskFindingService.findOne(workspaceId,findingId);
  }

  @ApiOperation({ summary: 'View risk summaries and trends' })
  @Get('/risk-statistics')
  getStatistics(@Param('workspaceId',ParseIntPipe)workspaceId:number){
    return this.riskFindingService.getStats(workspaceId);
  }
}
