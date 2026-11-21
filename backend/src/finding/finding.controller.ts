import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { FindingService } from './finding.service.js';
import { Findings } from './entities/finding.entity.js';
import { UpdateFindingStatusDto } from './dto/update-status-finding.dto.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';

@Controller('workspace/:workspaceId')
export class FindingController {
  constructor(private readonly findingService: FindingService) {}
  @Get('/findings')
  @UseGuards(JwtGuard)
  async GetFindings(@Param('workspaceId')workspaceId:number):Promise<Findings[]>{
    return await this.findingService.findAll(workspaceId);
  }
  @Get('/findings/statistics')
  @UseGuards(JwtGuard)
  async GetStatistics(@Param('workspaceId')workspaceId:number):Promise<{total:number;byStatus:Record<string,number>;bySeverity:Record<string,number>;}>{
    return await this.findingService.statistics(workspaceId);
  }
  @Get('/findings/:findingId')
  @UseGuards(JwtGuard)
  async GetFindingsById(@Param('workspaceId')workspaceId:number,@Param('findingId')findingId:string){
    return await this.findingService.findOne(workspaceId,findingId);
  }
  @Patch('/findings/:findingId/status')
  @UseGuards(JwtGuard)
  async UpdateStatus(@Param('workspaceId')workspaceId:number,@Param('findingId')findingId:string,@Body()dto:UpdateFindingStatusDto):Promise<Findings>{
    return await this.findingService.updateStatus(workspaceId,findingId,dto);
  }
  
  @Get('events/:eventId/findings')
  @UseGuards(JwtGuard)
  async getFindingsByEvent(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('eventId',ParseIntPipe)eventId:number):Promise<Findings[]>{
    return await this.findingService.findByEvent(workspaceId,eventId);
  }
}
