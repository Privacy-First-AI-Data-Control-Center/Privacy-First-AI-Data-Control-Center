import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExportService } from './export.service.js';
import { ExportJobs } from './entities/export.entity.js';
import { CreateExportDto } from './dto/create-export.dto.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { WorkspaceRoleGuard } from '../alert/guard/workspace-role.guard.js';
import { WorkspaceRoles } from '../alert/guard/workspace-roles.decorator.js';
import { Role } from '../user/enum/role.js';

@ApiTags('Exports')
@Controller('workspace/:workspaceId/exports')
@UseGuards(JwtGuard)
export class ExportController {
  constructor(private readonly exportJobsService: ExportService) {}

  @Post()
  async createExport(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Body() dto: CreateExportDto, @Req() req: any){
    return await this.exportJobsService.createExport(workspaceId, dto, req.user.id);
  }

  @Get()
  async getAllExports(@Param('workspaceId', ParseIntPipe) workspaceId: number): Promise<ExportJobs[]>{
    return await this.exportJobsService.getAllExports(workspaceId);
  }

  @Get('/:exportId')
  async getExportById(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('exportId', ParseIntPipe) exportId: number): Promise<ExportJobs>{
    return await this.exportJobsService.getExportsById(workspaceId, exportId);
  }

  @Get('/:exportId/download')
  async downloadExport(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('exportId', ParseIntPipe) exportId: number, @Req() req: any): Promise<StreamableFile>{
    return await this.exportJobsService.downloadExports(workspaceId, exportId, req.user.id);
  }

  @Post('/:exportId/cancel')
  async cancelExport(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('exportId', ParseIntPipe) exportId: number, @Req() req: any): Promise<string>{
    return await this.exportJobsService.cancelExports(workspaceId, exportId, req.user.id);
  }
}