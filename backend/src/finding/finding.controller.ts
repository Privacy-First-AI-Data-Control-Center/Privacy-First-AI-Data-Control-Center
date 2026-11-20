import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { FindingService } from './finding.service.js';
import { Findings } from './entities/finding.entity.js';
import { UpdateFindingStatusDto } from './dto/update-status-finding.dto.js';

@Controller('workspace/:workspaceId')
export class FindingController {
  constructor(private readonly findingService: FindingService) {}
  @Get('/findings')
  async GetFindings(@Param('workspaceId')workspaceId:number):Promise<Findings[]>{
    return await this.findingService.findAll(workspaceId);
  }
  @Get('/findings/:findingId')
  async GetFindingsById(@Param('workspaceId')workspaceId:number,@Param('findingId')findingId:string){
    return await this.findingService.findOne(workspaceId,findingId);
  }
  @Patch('/findings/:findingId/status')
  async UpdateStatus(@Param('workspaceId')workspaceId:number,@Param('findingsId')findingId:string,@Body()dto:UpdateFindingStatusDto):Promise<Findings>{
    return await this.findingService.updateStatus(workspaceId,findingId,dto);
  }
  @Get('/findings/statistics')
  async GetStatistics(@Param('workspaceId')workspaceId:number):Promise<{total:number;byStatus:Record<string,number>;bySeverity:Record<string,number>;}>{
    return await this.findingService.statistics(workspaceId);
  }
  @Get('events/:eventId/findings')
  async getFindingsByEvent(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('eventId',ParseIntPipe)eventId:number):Promise<Findings[]>{
    return await this.findingService.findByEvent(workspaceId,eventId);
  }
}
