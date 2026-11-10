import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { FindingService } from './finding.service.js';
import { Findings } from './entities/finding.entity.js';
import { UpdateFindingStatusDto } from './dto/update-status-finding.dto.js';

@Controller('workspace/:workspaceId/findings')
export class FindingController {
  constructor(private readonly findingService: FindingService) {}
  @Get()
  async GetFindings(@Param('workspaceId')workspaceId:number):Promise<Findings[]>{
    return await this.findingService.findAll(workspaceId);
  }
  @Get('/:findingId')
  async GetFindingsById(@Param('workspaceId')workspaceId:number,@Param('findingId')findingId:string){
    return await this.findingService.findOne(workspaceId,findingId);
  }
  @Patch('/:findingId/status')
  async UpdateStatus(@Param('workspaceId')workspaceId:number,@Param('findingsId')findingId:string,@Body()dto:UpdateFindingStatusDto):Promise<Findings>{
    return await this.findingService.updateStatus(workspaceId,findingId,dto);
  }
  @Get('/statistics')
  async GetStatistics(@Param('workspaceId')workspaceId:number):Promise<{total:number;byStatus:Record<string,number>;bySeverity:Record<string,number>;}>{
    return await this.findingService.statistics(workspaceId);
  }
}
