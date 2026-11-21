import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { WorkspaceMemberService } from './workspace-member.service.js';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto.js';
import { WorkspaceMembers } from './entity/workspace-members.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';
import { UpdateWorkspaceMemberDto } from './dto/update-workpsace-member.dto.js';

@Controller('workspace/:workspaceId/members')
@UseGuards(JwtGuard, RolesGuard)
export class WorkspaceMemberController {
  constructor(private readonly workspaceMemberService: WorkspaceMemberService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  async addMember(@Param('workspaceId') workspaceId: string, @Body() createWorkspaceMemberDto: CreateWorkspaceMemberDto): Promise<string>{
    createWorkspaceMemberDto.workspaceId = parseInt(workspaceId);
    return await this.workspaceMemberService.addMember(createWorkspaceMemberDto);
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getAllMembers(@Param('workspaceId') workspaceId: string): Promise<WorkspaceMembers[]>{
    return await this.workspaceMemberService.getAllMembers(workspaceId);
  }
  
  @Delete('/:memberId')
  @Roles(Role.OWNER, Role.ADMIN)
  async removeMember(@Param('workspaceId') workspaceId: string, @Param('memberId') memberId: string):Promise<string>{
    return await this.workspaceMemberService.removeMember(workspaceId, memberId)
  }

  @Patch('/:memberId')
  @Roles(Role.OWNER, Role.ADMIN)
  async updateMemberRole(@Param('workspaceId') workspaceId: string, @Param('memberId') memberId: string, @Body() updateWorkspaceMemberDto: UpdateWorkspaceMemberDto): Promise<string>{
    return await this.workspaceMemberService.updateMemberRole(workspaceId, memberId, updateWorkspaceMemberDto);
  }
}
