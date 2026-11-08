import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WorkspaceMemberService } from './workspace-member.service.js';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto.js';
import { WorkspaceMembers } from './entity/workspace-members.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';

@Controller('workspace/:workspaceId/members')
export class WorkspaceMemberController {
  constructor(private readonly workspaceMemberService: WorkspaceMemberService) {}

  @Post()
  @UseGuards(JwtGuard)
  async addMember(@Param('workspaceId') workspaceId: string, @Body() createWorkspaceMemberDto: CreateWorkspaceMemberDto): Promise<string>{
    createWorkspaceMemberDto.workspaceId = parseInt(workspaceId);
    return await this.workspaceMemberService.addMember(createWorkspaceMemberDto);
  }

  @Get()
  @UseGuards(JwtGuard)
  async getAllMembers(@Param('workspaceId') workspaceId: string): Promise<WorkspaceMembers[]>{
    return await this.workspaceMemberService.getAllMembers(workspaceId);
  }
  
  @Delete('/:memberId')
  @UseGuards(JwtGuard)
  async removeMember(@Param('workspaceId') workspaceId: string, @Param('memberId') memberId: string):Promise<string>{
    return await this.workspaceMemberService.removeMember(workspaceId, memberId)
  }
}
