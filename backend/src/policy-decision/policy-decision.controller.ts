import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { PolicyDecisionService } from './policy-decision.service.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { QueryPolicyDecisionDto } from './dto/query-policy-decision.dto.js';
import { PolicyDecision } from './entities/policy-decision.entity.js';

@Controller('workspace/:workspaceId')
export class PolicyDecisionController {
  constructor(private readonly policyDecisionService: PolicyDecisionService) {}
  @Get('/policy-decisions')
  @UseGuards(JwtGuard)
  async GetPolicyDecisions(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Query()query:QueryPolicyDecisionDto):Promise<PolicyDecision[]>{
    return this.policyDecisionService.findAll(workspaceId,query);
  }
  @Get('/policy-decisions/:decisionId')
  @UseGuards(JwtGuard)
  async GetPolicyDecisionDetails(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('decisionId',ParseIntPipe)decisionId:number):Promise<PolicyDecision>{
    return this.policyDecisionService.findOne(workspaceId,decisionId);
  }
  @Get('/events/:eventId/decisions')
  @UseGuards(JwtGuard)
  async getDecisionsByEvent(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('eventId',ParseIntPipe)eventId:number):Promise<PolicyDecision[]>{
    return await this.policyDecisionService.findByEvent(workspaceId,eventId);
  }
}
