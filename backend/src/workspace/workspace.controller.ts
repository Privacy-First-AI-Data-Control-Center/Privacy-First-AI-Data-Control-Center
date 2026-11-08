import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { WorkspaceService } from './workspace.service.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { Workspaces } from './entity/workspaces.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.sto.js';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @UseGuards(JwtGuard)
  async createWorkspace(@Req() req: any, @Body() createWorkspaceDto: CreateWorkspaceDto): Promise<string>{
    createWorkspaceDto.ownerUserId = req.user.id;
    return await this.workspaceService.createWorkspace(createWorkspaceDto);
  }

  @Get()
  @UseGuards(JwtGuard)
  async getAllWorkspaces(): Promise<Workspaces[]>{
    return await this.workspaceService.getAllWorkspaces();
  }

  @Get('/:id')
  @UseGuards(JwtGuard)
  async getWorkspaceById(@Param('id') id: string): Promise<Workspaces | null>{
    return await this.workspaceService.getWorkspaceById(id);
  }

  @Delete('/:id')
  @UseGuards(JwtGuard)
  async deleteWorkspace(@Param('id') id: string): Promise<string>{
    return await this.workspaceService.deleteWorkspace(id);
  }

  @Patch('/:id')
  @UseGuards(JwtGuard)
  async updateWorkspace(@Param('id') id: string,@Body() updateWorkspaceDto: UpdateWorkspaceDto): Promise<string>{
    return await this.workspaceService.updateWorkspace(id, updateWorkspaceDto);
  }
}
