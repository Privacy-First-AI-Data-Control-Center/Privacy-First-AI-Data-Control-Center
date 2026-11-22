import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindingService } from './finding.service.js';
import { Findings } from './entities/finding.entity.js';
import { UpdateFindingStatusDto } from './dto/update-status-finding.dto.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';

@ApiTags('Findings')
@Controller('workspaces/:workspaceId')
@UseGuards(JwtGuard, RolesGuard)
export class FindingController {
  constructor(private readonly findingService: FindingService) {}

  @ApiOperation({ summary: 'List detected sensitive-data findings' })
  @Get('/findings')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async GetFindings(@Param('workspaceId')workspaceId:number):Promise<Findings[]>{
    return await this.findingService.findAll(workspaceId);
  }

  @ApiOperation({ summary: 'View finding counts and trends' })
  @Get('/findings/statistics')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async GetStatistics(@Param('workspaceId')workspaceId:number):Promise<{total:number;byStatus:Record<string,number>;bySeverity:Record<string,number>;}>{
    return await this.findingService.statistics(workspaceId);
  }

  @ApiOperation({ summary: 'View a finding and its masked evidence' })
  @Get('/findings/:findingId')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async GetFindingsById(@Param('workspaceId')workspaceId:number,@Param('findingId')findingId:string){
    return await this.findingService.findOne(workspaceId,findingId);
  }

  @ApiOperation({ summary: 'Update the review status of a finding' })
  @Patch('/findings/:findingId/status')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async UpdateStatus(@Param('workspaceId')workspaceId:number,@Param('findingId')findingId:string,@Body()dto:UpdateFindingStatusDto):Promise<Findings>{
    return await this.findingService.updateStatus(workspaceId,findingId,dto);
  }
  
  @ApiOperation({ summary: 'View sensitive-data findings linked to an event' })
  @Get('events/:eventId/findings')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getFindingsByEvent(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('eventId',ParseIntPipe)eventId:number):Promise<Findings[]>{
    return await this.findingService.findByEvent(workspaceId,eventId);
  }
}
