import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PolicyDecisionService } from './policy-decision.service.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';
import { QueryPolicyDecisionDto } from './dto/query-policy-decision.dto.js';
import { PolicyDecision } from './entities/policy-decision.entity.js';

@ApiTags('Policy Decisions')
@Controller('workspace/:workspaceId')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
export class PolicyDecisionController {
  constructor(private readonly policyDecisionService: PolicyDecisionService) {}

  @ApiOperation({ summary: 'Search policy evaluation decisions' })
  @Get('/policy-decisions')
  async GetPolicyDecisions(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Query()query:QueryPolicyDecisionDto):Promise<PolicyDecision[]>{
    return this.policyDecisionService.findAll(workspaceId,query);
  }

  @ApiOperation({ summary: 'View one policy decision and its outcome' })
  @Get('/policy-decisions/:decisionId')
  async GetPolicyDecisionDetails(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('decisionId',ParseIntPipe)decisionId:number):Promise<PolicyDecision>{
    return this.policyDecisionService.findOne(workspaceId,decisionId);
  }

  @ApiOperation({ summary: 'View policy decisions linked to an event' })
  @Get('/events/:eventId/decisions')
  async getDecisionsByEvent(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('eventId',ParseIntPipe)eventId:number):Promise<PolicyDecision[]>{
    return await this.policyDecisionService.findByEvent(workspaceId,eventId);
  }
}
