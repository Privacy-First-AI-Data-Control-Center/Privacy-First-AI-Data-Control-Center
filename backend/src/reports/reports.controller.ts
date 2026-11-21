import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { UpdateReportDto } from './dto/update-report.dto.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Reports')
@Controller('workspaces/:workspaceId/reports')
@UseGuards(JwtGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Create a saved report definition' })
  @ApiResponse({ status: 201, description: 'Report definition created' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Post()
  async create(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() dto: CreateReportDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.reportsService.create(workspaceId, dto, userId);
  }

  @ApiOperation({ summary: 'List saved report definitions for a workspace' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @Get()
  async findAll(@Param('workspaceId', ParseIntPipe) workspaceId: number) {
    return this.reportsService.findAll(workspaceId);
  }

  @ApiOperation({ summary: 'View a single report definition and its recent runs' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @Get(':reportId')
  async findOne(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
  ) {
    return this.reportsService.findOne(workspaceId, reportId);
  }

  @ApiOperation({ summary: 'Update a saved report definition' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch(':reportId')
  async update(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() dto: UpdateReportDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.reportsService.update(workspaceId, reportId, dto, userId);
  }

  @ApiOperation({ summary: 'Delete a saved report definition (soft delete)' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Delete(':reportId')
  async remove(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.reportsService.remove(workspaceId, reportId, userId);
  }

  @ApiOperation({ summary: 'Start generating a new report run' })
  @ApiResponse({ status: 201, description: 'Report run queued (PENDING)' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Post(':reportId/runs')
  @HttpCode(HttpStatus.CREATED)
  async triggerRun(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.reportsService.triggerRun(workspaceId, reportId, userId);
  }

  @ApiOperation({ summary: 'List all generated runs for a report' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @Get(':reportId/runs')
  async findRuns(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
  ) {
    return this.reportsService.findRuns(workspaceId, reportId);
  }

  @ApiOperation({ summary: 'View status and details of one report run' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @Get(':reportId/runs/:runId')
  async findOneRun(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Param('runId', ParseIntPipe) runId: number,
  ) {
    return this.reportsService.findOneRun(workspaceId, reportId, runId);
  }

  @ApiOperation({ summary: 'Download a completed report file (JSON or CSV)' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @Get(':reportId/runs/:runId/download')
  async downloadRun(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Param('runId', ParseIntPipe) runId: number,
    @CurrentUser('id') userId: number,
  ): Promise<StreamableFile> {
    return this.reportsService.downloadRun(workspaceId, reportId, runId, userId);
  }
}
