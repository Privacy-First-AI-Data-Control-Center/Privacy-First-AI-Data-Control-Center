import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnforcementActionService } from './enforcement-action.service.js';
import { QueryEnforcementActionDto } from './dto/query-enforcement-action.dto.js';
import { EnforcementAction } from './entities/enforcement-action.entity.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';

@ApiTags('Enforcement Actions')
@Controller('workspaces/:workspaceId/')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
export class EnforcementActionController {
  constructor(private readonly enforcementActionService: EnforcementActionService) {}

  @ApiOperation({ summary: 'List enforcement attempts and outcomes' })
  @Get('/enforcement-actions')
  async GetEnforcementActions(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Query()query:QueryEnforcementActionDto):Promise<EnforcementAction[]>{
    return this.enforcementActionService.findAll(workspaceId,query);
  }

  @ApiOperation({ summary: 'View enforcement action details' })
  @Get('/enforcement-actions/:actionId')
  async GetEnforcementActionDetails(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('actionId',ParseIntPipe)actionId:number):Promise<EnforcementAction>{
    return this.enforcementActionService.findOne(workspaceId,actionId);
  }

  @ApiOperation({ summary: 'List enforcement actions for a policy decision' })
  @Get('policy-decisions/:decisionId/enforcement-actions')
  async GetEnforcementActionsByDecision(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('decisionId',ParseIntPipe)decisionId:number):Promise<EnforcementAction[]>{
    return this.enforcementActionService.findByDecision(workspaceId,decisionId);
  }
}
