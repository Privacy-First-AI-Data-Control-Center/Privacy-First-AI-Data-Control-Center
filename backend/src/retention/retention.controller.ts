import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RetentionService } from './retention.service.js';
import { RetentionSettings } from './entities/retention-settings.entity.js';
import { CreateRetentionDto } from './dto/create-retention.dto.js';
import { UpdateRetentionDto } from './dto/update-retention.dto.js';
import { PreviewRetentionDto } from './dto/preview-retention.dto.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { WorkspaceRoleGuard } from '../alert/guard/workspace-role.guard.js';
import { WorkspaceRoles } from '../alert/guard/workspace-roles.decorator.js';
import { Role } from '../user/enum/role.js';
import { RetentionJobService } from './retention-job.service.js';



@ApiTags('Retention')
@Controller('workspace/:workspaceId')
@UseGuards(JwtGuard, WorkspaceRoleGuard)
export class RetentionController {
  constructor(private readonly retentionService: RetentionService,
    private readonly retentionJobService: RetentionJobService
  ) {}

  @Post('/retention-settings')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN)
  async createSetting(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Body() createRetentionDto: CreateRetentionDto,
   @Req() req: any): Promise<RetentionSettings>{
    return await this.retentionService.createSetting(workspaceId, createRetentionDto, req.user.id);
  }

  @Get('/retention-settings')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async getAllSettings(@Param('workspaceId', ParseIntPipe) workspaceId: number): Promise<RetentionSettings[]>{
    return await this.retentionService.getAllSettings(workspaceId);
  }

  @Get('/retention-settings/:settingId')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async getSettingById(@Param('workspaceId', ParseIntPipe) workspaceId: number,
   @Param('settingId', ParseIntPipe) settingId: number): Promise<RetentionSettings>{
    return await this.retentionService.getSettingsById(workspaceId, settingId);
  }

  @Patch('/retention-settings/:settingId')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN)
  async updateSetting(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('settingId', ParseIntPipe) 
  settingId: number, @Body() updateRetentionDto: UpdateRetentionDto, @Req() req: any): Promise<string>{
    return await this.retentionService.updateSetting(workspaceId, settingId, updateRetentionDto, req.user.id);
  }

  @Delete('/retention-settings/:settingId')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN)
  async deleteSetting(@Param('workspaceId', ParseIntPipe) workspaceId: number,
   @Param('settingId', ParseIntPipe) settingId: number, @Req() req: any): Promise<string>{
    return await this.retentionService.deleteSetting(workspaceId, settingId, req.user.id);
  }

  @Post('/retention/preview')
  @WorkspaceRoles(Role.OWNER, Role.ADMIN)
  async preview(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Body() previewRetentionDto: PreviewRetentionDto){
    return await this.retentionService.preview(workspaceId, previewRetentionDto);
  }
  
@Post('/retention/run')
@WorkspaceRoles(Role.OWNER, Role.ADMIN)
async runRetention(@Param('workspaceId', ParseIntPipe) workspaceId: number){
  return await this.retentionJobService.runForWorkspace(workspaceId);
}
}