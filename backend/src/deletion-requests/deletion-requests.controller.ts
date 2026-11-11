import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeletionRequestsService } from './deletion-requests.service.js';
import { DeletionRequests } from './entities/deletion-requests.entity.js';
import { CreateDeletionRequestDto } from './dto/create-deletion-request.dto.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { WorkspaceRoleGuard } from '../alert/guard/workspace-role.guard.js';
import { WorkspaceRoles } from '../alert/guard/workspace-roles.decorator.js';
import { Role } from '../user/enum/role.js';

@ApiTags('Deletion Requests')
@Controller('workspace/:workspaceId/deletion-requests')
@UseGuards(JwtGuard)
export class DeletionRequestsController {
  constructor(private readonly deletionRequestsService: DeletionRequestsService) {}

  @Post()
  async createRequest(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Body() dto: CreateDeletionRequestDto, @Req() req: any){
    return await this.deletionRequestsService.createRequest(workspaceId, dto, req.user.id);
  }

  @Get()
  async getAllRequests(@Param('workspaceId', ParseIntPipe) workspaceId: number): Promise<DeletionRequests[]>{
    return await this.deletionRequestsService.getAllRequest(workspaceId);
  }

  @Get('/:requestId')
  async getRequestById(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('requestId', ParseIntPipe) requestId: number): Promise<DeletionRequests>{
    return await this.deletionRequestsService.getRequestById(workspaceId, requestId);
  }

  @Post('/:requestId/cancel')
  async cancelRequest(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('requestId', ParseIntPipe) requestId: number, @Req() req: any): Promise<string>{
    return await this.deletionRequestsService.cancelRequest(workspaceId, requestId, req.user.id);
  }

  @Get('/:requestId/verification')
  async getVerification(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Param('requestId', ParseIntPipe) requestId: number){
    return await this.deletionRequestsService.getVerification(workspaceId, requestId);
  }
}