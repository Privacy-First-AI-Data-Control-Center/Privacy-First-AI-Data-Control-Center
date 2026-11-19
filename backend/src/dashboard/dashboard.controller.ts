import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { WorkspaceRoleGuard } from '../alert/guard/workspace-role.guard.js';
import { WorkspaceRoles } from '../alert/guard/workspace-roles.decorator.js';
import { Role } from '../user/enum/role.js';

@ApiTags('Dashboard')
@Controller('workspace/:workspaceId/dashboard')
@UseGuards(JwtGuard, WorkspaceRoleGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/overview')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getOverview(@Param('workspaceId', ParseIntPipe) workspaceId: number){
    return await this.dashboardService.getOverview(workspaceId);
  }

  @Get('/activity')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getActivity(@Param('workspaceId', ParseIntPipe) workspaceId: number){
    return await this.dashboardService.getActivity(workspaceId);
  }

  @Get('/risk')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getRisk(@Param('workspaceId', ParseIntPipe) workspaceId: number){
    return await this.dashboardService.getRisk(workspaceId);
  }

  @Get('/sensitive-data')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getSensitiveData(@Param('workspaceId', ParseIntPipe) workspaceId: number){
    return await this.dashboardService.getSensitiveData(workspaceId);
  }

  @Get('/alerts')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async getAlerts(@Param('workspaceId', ParseIntPipe) workspaceId: number){
    return await this.dashboardService.getAlert(workspaceId);
  }

  @Get('/policy-performance')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async getPolicyPerformance(@Param('workspaceId', ParseIntPipe) workspaceId: number){
    return await this.dashboardService.getPolicyPerformance(workspaceId);
  }
}