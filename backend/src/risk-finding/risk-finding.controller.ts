import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { RiskFindingService } from './risk-finding.service.js';
import { QueryRiskFindingDto } from './dto/query-risk-finding.dto.js';
import { RiskFinding } from './entities/risk-finding.entity.js';
import { workerData } from 'worker_threads';
import { JwtGuard } from '../auth/jwtGuard.guard.js';

@Controller('workspaces/:workspaceId/risk-findings')
export class RiskFindingController {
  constructor(private readonly riskFindingService: RiskFindingService) {}

  @Get()
  @UseGuards(JwtGuard)
  async findAll(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Query()query:QueryRiskFindingDto):Promise<RiskFinding[]>{
    return await this.riskFindingService.findAll(workspaceId,query);
  }
  @Get('/:findingId')
  @UseGuards(JwtGuard)
  async findOne(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('findingId',ParseIntPipe)findingId:number):Promise<RiskFinding>{
    return await this.riskFindingService.findOne(workspaceId,findingId);
  }
  @Get('risk-statistics')
  @UseGuards(JwtGuard)
  getStatistics(@Param('workspaceId',ParseIntPipe)workspaceId:number){
    return this.riskFindingService.getStats(workspaceId);
  }
}
