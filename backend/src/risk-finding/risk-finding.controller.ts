import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RiskFindingService } from './risk-finding.service.js';
import { QueryRiskFindingDto } from './dto/query-risk-finding.dto.js';
import { RiskFinding } from './entities/risk-finding.entity.js';
import { workerData } from 'worker_threads';
import { JwtGuard } from '../auth/jwtGuard.guard.js';

@ApiTags('Risk Findings')
@Controller('workspaces/:workspaceId')
export class RiskFindingController {
  constructor(private readonly riskFindingService: RiskFindingService) {}

  @ApiOperation({ summary: 'List risk findings' })
  @Get('/risk-findings')
  @UseGuards(JwtGuard)
  async findAll(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Query()query:QueryRiskFindingDto):Promise<RiskFinding[]>{
    return await this.riskFindingService.findAll(workspaceId,query);
  }

  @ApiOperation({ summary: 'View a risk finding' })
  @Get('/risk-findings/:findingId')
  @UseGuards(JwtGuard)
  async findOne(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('findingId',ParseIntPipe)findingId:number):Promise<RiskFinding>{
    return await this.riskFindingService.findOne(workspaceId,findingId);
  }

  @ApiOperation({ summary: 'View risk summaries and trends' })
  @Get('/risk-statistics')
  @UseGuards(JwtGuard)
  getStatistics(@Param('workspaceId',ParseIntPipe)workspaceId:number){
    return this.riskFindingService.getStats(workspaceId);
  }
}
