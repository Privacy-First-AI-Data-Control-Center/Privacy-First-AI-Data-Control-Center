import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { WorkspaceService } from './workspace.service.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { Workspaces } from './entity/workspaces.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.sto.js';

@Controller('workspace')
@UseGuards(JwtGuard, RolesGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async createWorkspace(@Req() req: any, @Body() createWorkspaceDto: CreateWorkspaceDto): Promise<string>{
    createWorkspaceDto.ownerUserId = req.user.id;
    return await this.workspaceService.createWorkspace(createWorkspaceDto);
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getAllWorkspaces(): Promise<Workspaces[]>{
    return await this.workspaceService.getAllWorkspaces();
  }

  @Get('/:id')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getWorkspaceById(@Param('id') id: string): Promise<Workspaces | null>{
    return await this.workspaceService.getWorkspaceById(id);
  }

  @Delete('/:id')
  @Roles(Role.OWNER)
  async deleteWorkspace(@Param('id') id: string): Promise<string>{
    return await this.workspaceService.deleteWorkspace(id);
  }

  @Patch('/:id')
  @Roles(Role.OWNER, Role.ADMIN)
  async updateWorkspace(@Param('id') id: string,@Body() updateWorkspaceDto: UpdateWorkspaceDto): Promise<string>{
    return await this.workspaceService.updateWorkspace(id, updateWorkspaceDto);
  }
}
