import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { PolicyDecisionService } from './policy-decision.service.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { QueryPolicyDecisionDto } from './dto/query-policy-decision.dto.js';
import { PolicyDecision } from './entities/policy-decision.entity.js';

@Controller('workspace/:workspaceId/policy-decisions')
export class PolicyDecisionController {
  constructor(private readonly policyDecisionService: PolicyDecisionService) {}
  @Get()
  @UseGuards(JwtGuard)
  async GetPolicyDecisions(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Query()query:QueryPolicyDecisionDto):Promise<PolicyDecision[]>{
    return this.policyDecisionService.findAll(workspaceId,query);
  }
  @Get('/:decisionId')
  @UseGuards(JwtGuard)
  async GetPolicyDecisionDetails(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('decisionId',ParseIntPipe)decisionId:number):Promise<PolicyDecision>{
    return this.policyDecisionService.findOne(workspaceId,decisionId);
  }
}
