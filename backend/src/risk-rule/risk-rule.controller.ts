import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RiskRuleService } from './risk-rule.service.js';
import { CreateRiskRuleDto } from './dto/create-risk-rule.dto.js';
import { RiskRule } from './entities/risk-rule.entity.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';
import { QueryRiskRuleDto } from './dto/query-risk-rule.dto.js';
import { UpdateRiskRuleDto } from './dto/update-risk-rule.dto.js';

@ApiTags('Risk Rules')
@Controller('workspaces/:workspaceId/risk-rules')
@UseGuards(JwtGuard, RolesGuard)
export class RiskRuleController {
  constructor(private readonly riskRuleService: RiskRuleService) {}

  @ApiOperation({ summary: 'Create a risk-detection rule' })
  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  async create(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Body()dto:CreateRiskRuleDto):Promise<RiskRule>{
    return await this.riskRuleService.create(workspaceId,dto);
  }

  @ApiOperation({ summary: 'List risk rules' })
  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async findAll(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Query()query:QueryRiskRuleDto):Promise<RiskRule[]>{
    return await this.riskRuleService.findAll(workspaceId,query);
  }

  @ApiOperation({ summary: 'View one risk rule' })
  @Get('/:ruleId')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  GetRiskRule(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('ruleId',ParseIntPipe)ruleId:number):Promise<RiskRule>{
    return this.riskRuleService.findOne(workspaceId,ruleId);
  }

  @ApiOperation({ summary: 'Update a risk rule' })
  @Patch(':ruleId')
  @Roles(Role.OWNER, Role.ADMIN)
  update(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('ruleId',ParseIntPipe)ruleId:number,@Body()dto:UpdateRiskRuleDto):Promise<RiskRule>{
    return this.riskRuleService.update(workspaceId,ruleId,dto);
  }

  @ApiOperation({ summary: 'Delete or deactivate a risk rule' })
  @Delete(':ruleId')
  @Roles(Role.OWNER, Role.ADMIN)
  DeleteRuleId(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('ruleId',ParseIntPipe)ruleId:number){
    return this.riskRuleService.delete(workspaceId,ruleId);
  }

}
