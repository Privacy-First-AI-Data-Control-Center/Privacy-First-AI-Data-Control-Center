import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { EnforcementActionService } from './enforcement-action.service.js';
import { QueryEnforcementActionDto } from './dto/query-enforcement-action.dto.js';
import { EnforcementAction } from './entities/enforcement-action.entity.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';

@Controller('workspaces/:workspaceId/enforcement-actions')
export class EnforcementActionController {
  constructor(private readonly enforcementActionService: EnforcementActionService) {}
  @Get()
  @UseGuards(JwtGuard)
  async GetEnforcementActions(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Query()query:QueryEnforcementActionDto):Promise<EnforcementAction[]>{
    return this.enforcementActionService.findAll(workspaceId,query);
  }
  @Get('/:actionId')
  @UseGuards(JwtGuard)
  async GetEnforcementActionDetails(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('actionId',ParseIntPipe)actionId:number):Promise<EnforcementAction>{
    return this.enforcementActionService.findOne(workspaceId,actionId);
  }
  @Get('/:decisionId/enforcement-actions')
  @UseGuards(JwtGuard)
  async GetEnforcementActionsByDecision(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('decisionId',ParseIntPipe)decisionId:number):Promise<EnforcementAction[]>{
    return this.enforcementActionService.findByDecision(workspaceId,decisionId);
  }
}
