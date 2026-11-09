import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RetentionService } from './retention.service.js';
import { RetentionSettings } from './entities/retention-settings.entity.js';
import { CreateRetentionDto } from './dto/create-retention.dto.js';
import { UpdateRetentionDto } from './dto/update-retention.dto.js';
import { PreviewRetentionDto } from './dto/preview-retention.dto.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RetentionJobService } from './retention-job.service.js';



@ApiTags('Retention')
@Controller('workspace/:workspaceId')
@UseGuards(JwtGuard)
export class RetentionController {
  constructor(private readonly retentionService: RetentionService,
    private readonly retentionJobService: RetentionJobService
  ) {}

  @Post('/retention-settings')
  async createSetting(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Body() createRetentionDto: CreateRetentionDto,
   @Req() req: any): Promise<RetentionSettings>{
    return await this.retentionService.createSetting(workspaceId, createRetentionDto, req.user.id);
  }

  @Get('/retention-settings')
  async getAllSettings(@Param('workspaceId', ParseIntPipe) workspaceId: number): Promise<RetentionSettings[]>{
    return await this.retentionService.getAllSettings(workspaceId);
  }

  @Get('/retention-settings/:settingId')
  async getSettingById(@Param('workspaceId', ParseIntPipe) workspaceId: number,
   @Param('settingId', ParseIntPipe) settingId: number): Promise<RetentionSettings>{
    return await this.retentionService.getSettingsById(workspaceId, settingId);
  }

  @Patch('/retention-settings/:settingId')
  async updateSetting(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('settingId', ParseIntPipe) 
  settingId: number, @Body() updateRetentionDto: UpdateRetentionDto, @Req() req: any): Promise<string>{
    return await this.retentionService.updateSetting(workspaceId, settingId, updateRetentionDto, req.user.id);
  }

  @Delete('/retention-settings/:settingId')
  async deleteSetting(@Param('workspaceId', ParseIntPipe) workspaceId: number,
   @Param('settingId', ParseIntPipe) settingId: number, @Req() req: any): Promise<string>{
    return await this.retentionService.deleteSetting(workspaceId, settingId, req.user.id);
  }

  @Post('/retention/preview')
  async preview(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Body() previewRetentionDto: PreviewRetentionDto){
    return await this.retentionService.preview(workspaceId, previewRetentionDto);
  }
  
@Post('/retention/run')
async runRetention(@Param('workspaceId', ParseIntPipe) workspaceId: number){
  return await this.retentionJobService.runForWorkspace(workspaceId);
}
}