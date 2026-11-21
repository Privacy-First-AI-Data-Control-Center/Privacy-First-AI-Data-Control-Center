import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RiskRuleService } from './risk-rule.service.js';
import { CreateRiskRuleDto } from './dto/create-risk-rule.dto.js';
import { RiskRule } from './entities/risk-rule.entity.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { QueryRiskRuleDto } from './dto/query-risk-rule.dto.js';
import { UpdateRiskRuleDto } from './dto/update-risk-rule.dto.js';

@ApiTags('Risk Rules')
@Controller('workspaces/:workspaceId/risk-rules')
export class RiskRuleController {
  constructor(private readonly riskRuleService: RiskRuleService) {}

  @ApiOperation({ summary: 'Create a risk-detection rule' })
  @Post()
  @UseGuards(JwtGuard)
  async create(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Body()dto:CreateRiskRuleDto):Promise<RiskRule>{
    return await this.riskRuleService.create(workspaceId,dto);
  }

  @ApiOperation({ summary: 'List risk rules' })
  @Get()
  @UseGuards(JwtGuard)
  async findAll(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Query()query:QueryRiskRuleDto):Promise<RiskRule[]>{
    return await this.riskRuleService.findAll(workspaceId,query);
  }

  @ApiOperation({ summary: 'View one risk rule' })
  @Get('/:ruleId')
  @UseGuards(JwtGuard)
  GetRiskRule(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('ruleId',ParseIntPipe)ruleId:number):Promise<RiskRule>{
    return this.riskRuleService.findOne(workspaceId,ruleId);
  }

  @ApiOperation({ summary: 'Update a risk rule' })
  @Patch(':ruleId')
  @UseGuards(JwtGuard)
  update(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('ruleId',ParseIntPipe)ruleId:number,@Body()dto:UpdateRiskRuleDto):Promise<RiskRule>{
    return this.riskRuleService.update(workspaceId,ruleId,dto);
  }

  @ApiOperation({ summary: 'Delete or deactivate a risk rule' })
  @Delete(':ruleId')
  @UseGuards(JwtGuard)
  DeleteRuleId(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('ruleId',ParseIntPipe)ruleId:number){
    return this.riskRuleService.delete(workspaceId,ruleId);
  }

}
