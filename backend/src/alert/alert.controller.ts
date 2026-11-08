import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AlertService } from './alert.service.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
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

@Controller('workspace/:workspaceId/alerts')
@UseGuards(JwtGuard)
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  
  @Get('/statistics')
  async getStatistics(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Query() query: StatisticsQueryDto){
    return await this.alertService.getStatistics(workspaceId, query.from, query.to);
  }

 @Get()
 @ApiQuery({ name: 'status', required: false, enum: AlertStatus })
@ApiQuery({ name: 'severity', required: false, enum: AlertSeverity })
async getAllAlerts(@Param('workspaceId') workspaceId: string, @Query('status') status: string, @Query('severity') severity: string): Promise<Alerts[]>{
  return await this.alertService.getAllAlerts(workspaceId, status, severity);
}
 
  @Post()
  async createAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Body() createAlertDto: CreateAlertDto, @Req() req: any): Promise<Alerts>{
    return await this.alertService.createAlert(workspaceId, createAlertDto, req.user.id);
  }

  @Get('/:alertId')
 
  async getAlertById(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('alertId', ParseIntPipe) alertId: number): Promise<Alerts>{
    return await this.alertService.getAlertById(workspaceId, alertId);
  }

 @Patch('/:alertId')
async updateAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('alertId', ParseIntPipe) 
alertId: number, @Body() updateAlertDto: UpdateAlertDto, @Req() req: any): Promise<string>
{
  return await this.alertService.updateAlert(workspaceId, alertId, updateAlertDto, req.user.id);
}

 
  @Post('/:alertId/acknowledge')
  async acknowlegeAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, 
  @Param('alertId', ParseIntPipe) alertId: number, @Body() body: AlertActionDto, @Req() req: any): Promise<string>
  {
       return await this.alertService.acknowledgeAlert(workspaceId, alertId, req.user.id, body.note);

  }

   @Post('/:alertId/resolve')
  async resolveAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, 
  @Param('alertId', ParseIntPipe) alertId: number, @Body() body: AlertActionDto, @Req() req: any): Promise<string>
  {
       return await this.alertService.resolveAlert(workspaceId, alertId, req.user.id, body.note);

  }

   @Post('/:alertId/reopen')
  async reopenAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, 
  @Param('alertId', ParseIntPipe) alertId: number, @Body() body: AlertActionDto, @Req() req: any): Promise<string>
  {
       return await this.alertService.reopenAlert(workspaceId, alertId, req.user.id, body.note);

  }

  @Post('/:alertId/assign')
 
  async assignAlert(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('alertId', ParseIntPipe) alertId: number, @Body() assignAlertDto: AssignAlertDto, @Req() req: any): Promise<string>{
    return await this.alertService.assignAlert(workspaceId, alertId, assignAlertDto, req.user.id);
  }

  @Get('/:alertId/history')
 
  async getAlertHistory(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('alertId', ParseIntPipe) alertId: number): Promise<AlertHistories[]>{
    return await this.alertService.getAlertHistory(workspaceId, alertId);
  }
}