import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AlertService } from './alert.service.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';
import { Alerts } from './entities/alerts.entity.js';
import { AlertHistories } from './entities/alert-histories.entity.js';
import { CreateAlertDto } from './dto/create-alert.dto.js';
import { UpdateAlertDto } from './dto/update-alert.dto.js';
import { AssignAlertDto } from './dto/assign-alert.dto.js';
import { AlertActionDto } from './dto/alert-action.dto.js';
import { QueryAlertDto } from './dto/query-alert.dto.js';
import { StatisticsQueryDto } from './dto/statistics-query.dto.js';
import { ApiQuery } from '@nestjs/swagger';
import { AlertStatus } from './enum/alert-status.js';
import { AlertSeverity } from './enum/alert-severity.js';
import { WorkspaceRoleGuard } from './guard/workspace-role.guard.js';
import { WorkspaceRoles } from './guard/workspace-roles.decorator.js';

@Controller('workspace/:workspaceId/alerts')
@UseGuards(JwtGuard, WorkspaceRoleGuard)
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  
  @Get('/statistics')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async getStatistics(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Query() query: StatisticsQueryDto){
    return await this.alertService.getStatistics(workspaceId, query.from, query.to);
  }

 @Get()
 @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER)
 @ApiQuery({ name: 'status', required: false, enum: AlertStatus })
@ApiQuery({ name: 'severity', required: false, enum: AlertSeverity })
async getAllAlerts(@Param('workspaceId') workspaceId: string, @Query('status') status: string, @Query('severity') severity: string): Promise<Alerts[]>{
  return await this.alertService.getAllAlerts(workspaceId, status, severity);
}
 
  @Post()
  @WorkspaceRoles(Role.OWNER, Role.ADMIN)
  async createAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Body() createAlertDto: CreateAlertDto, @Req() req: any): Promise<Alerts>{
    return await this.alertService.createAlert(workspaceId, createAlertDto, req.user.id);
  }

  @Get('/:alertId')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async getAlertById(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('alertId', ParseIntPipe) alertId: number): Promise<Alerts>{
    return await this.alertService.getAlertById(workspaceId, alertId);
  }

 @Patch('/:alertId')
 @WorkspaceRoles(Role.OWNER, Role.ADMIN)
async updateAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('alertId', ParseIntPipe) 
alertId: number, @Body() updateAlertDto: UpdateAlertDto, @Req() req: any): Promise<string>
{
  return await this.alertService.updateAlert(workspaceId, alertId, updateAlertDto, req.user.id);
}

 
  @Post('/:alertId/acknowledge')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async acknowlegeAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, 
  @Param('alertId', ParseIntPipe) alertId: number, @Body() body: AlertActionDto, @Req() req: any): Promise<string>
  {
       return await this.alertService.acknowledgeAlert(workspaceId, alertId, req.user.id, body.note);

  }

   @Post('/:alertId/resolve')
   @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async resolveAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, 
  @Param('alertId', ParseIntPipe) alertId: number, @Body() body: AlertActionDto, @Req() req: any): Promise<string>
  {
       return await this.alertService.resolveAlert(workspaceId, alertId, req.user.id, body.note);

  }

   @Post('/:alertId/reopen')
   @WorkspaceRoles(Role.OWNER, Role.ADMIN)
  async reopenAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, 
  @Param('alertId', ParseIntPipe) alertId: number, @Body() body: AlertActionDto, @Req() req: any): Promise<string>
  {
       return await this.alertService.reopenAlert(workspaceId, alertId, req.user.id, body.note);

  }

  @Post('/:alertId/assign')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN)
  async assignAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('alertId', ParseIntPipe) alertId: number, @Body() assignAlertDto: AssignAlertDto, @Req() req: any): Promise<string>{
    return await this.alertService.assignAlert(workspaceId, alertId, assignAlertDto, req.user.id);
  }

  @Get('/:alertId/history')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async getAlertHistory(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('alertId', ParseIntPipe) alertId: number): Promise<AlertHistories[]>{
    return await this.alertService.getAlertHistory(workspaceId, alertId);
  }
}