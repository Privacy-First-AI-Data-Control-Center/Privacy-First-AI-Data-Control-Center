import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PolicyService } from './policy.service.js';
import { CreateWorkspaceDto } from '../workspace/dto/create-workspace.dto.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { Policies } from './entities/policy.entity.js';
import { PolicyVersions } from './entities/policy-version.entity.js';
import { CreatePolicyDto } from './dto/create-policy.dto.js';
import { PolicyStatus } from './enums/policy-status.enum.js';
import { WorkspaceStatus } from '../workspace/enum/workspace-status.js';
import { RuleEffect } from './enums/policy-rule.enum.js';
import { PolicyRules } from './entities/policy-rule.entity.js';
import { partialUpdatePolicyDto } from './dto/partial-update-policy.dto.js';
import { TestPolicyDto } from './dto/test-policy.dto.js';

@ApiTags('Policies')
@Controller('workspace/:workspaceId/policy')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @ApiOperation({ summary: 'Create a workspace privacy policy' })
  @Post()
  @UseGuards(JwtGuard)
  async CreatePolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Body()dto:CreatePolicyDto,@Req()req:any):Promise<Policies & {currentVersion:PolicyVersions}>{
    return await this.policyService.create(workspaceId,dto,req.user.id);
  }

  @ApiOperation({ summary: 'List workspace policies' })
  @Get()
  @UseGuards(JwtGuard)
  async PolicyList(@Param('workspaceId',ParseIntPipe)workspaceId:number, @Query('Status')status?:PolicyStatus):Promise<Policies[]>{
    return this.policyService.findAll(workspaceId,status);
  }

  @ApiOperation({ summary: 'View policy details' })
  @Get('/:policyId')
  @UseGuards(JwtGuard)
  async GetPolicyDetails(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number):Promise<Policies & {currentVersion:PolicyVersions}>{
    return this.policyService.findOne(workspaceId,policyId)
  }

  @ApiOperation({ summary: 'Update a policy by creating a new immutable version' })
  @Patch('/:policyId')
  @UseGuards(JwtGuard)
  async UpdatePolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Body()dto:partialUpdatePolicyDto,@Req()req:any):Promise<PolicyVersions>{
    return this.policyService.update(workspaceId,policyId,dto,req.user.id);
  }

  @ApiOperation({ summary: 'Archive or deactivate a policy' })
  @Delete('/:policyId')
  @UseGuards(JwtGuard)
  async DeletePolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number){
    return this.policyService.delete(workspaceId,policyId);
  }

  @ApiOperation({ summary: 'Enable a policy' })
  @Post('/:policyId/enable')
  @UseGuards(JwtGuard)
  async EnablePolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number):Promise<Policies & { currentVersion: PolicyVersions | null }>{
    return this.policyService.enable(workspaceId,policyId);
  }

  @ApiOperation({ summary: 'Disable a policy' })
  @Post('/:policyId/disable')
  @UseGuards(JwtGuard)
  async ArchivePolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number):Promise<Policies & { currentVersion: PolicyVersions | null }>{
    return this.policyService.disable(workspaceId,policyId);
  }

  @ApiOperation({ summary: 'Test policy rules against sample input' })
  @Post('/:policyId/test')
  @UseGuards(JwtGuard)
  async TestPolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Body()dto:TestPolicyDto):Promise<{versionId:number,decision:RuleEffect,reason:string,matchedRuleIds?:number[],}>{
    return this.policyService.test(workspaceId,policyId,dto);
  }

  @ApiOperation({ summary: 'List immutable policy versions' })
  @Get('/:policyId/versions')
  @UseGuards(JwtGuard)
  async GetPolicyVersions(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number):Promise<PolicyVersions[]>{
    return this.policyService.findVersions(workspaceId,policyId);
  }

  @ApiOperation({ summary: 'View a specific policy version' })
  @Get('/:policyId/versions/:versionId')
  @UseGuards(JwtGuard)
  async GetPolicyVersionDetails(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('versionId',ParseIntPipe)versionId:number):Promise<PolicyVersions>{
    return this.policyService.findOneVersion(workspaceId,policyId,versionId);
  }

  @ApiOperation({ summary: 'Activate a selected policy version' })
  @Post('/:policyId/versions/:versionId/active')
  @UseGuards(JwtGuard)
  async ActivePolicyVersion(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('versionId',ParseIntPipe)versionId:number,@Req()req:any):Promise<PolicyVersions>{
    return this.policyService.activeVersion(workspaceId,policyId,versionId,req.user.id);
  }

  @ApiOperation({ summary: 'List rules in a policy version' })
  @Get('/:policyId/versions/:versionId/rules')
  @UseGuards(JwtGuard)
  async GetPolicyVersionRules(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('versionId',ParseIntPipe)versionId:number):Promise<PolicyRules[]>{
    return this.policyService.findRules(workspaceId,policyId,versionId);
  }

  @ApiOperation({ summary: 'Add a rule to a policy version' })
  @Post('/:policyId/versions/:versionId/rules')
  @UseGuards(JwtGuard)
  async AddPolicyVersionRule(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('versionId',ParseIntPipe)versionId:number,@Body()dto:any):Promise<PolicyRules>{
    return this.policyService.addRule(workspaceId,policyId,versionId,dto);
  }

  @ApiOperation({ summary: 'Update a policy rule' })
  @Patch('/:policyId/versions/:versionId/rules/:ruleId')
  @UseGuards(JwtGuard)
  async UpdatePolicyVersionRule(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('ruleId',ParseIntPipe)ruleId:number,@Body()dto:any):Promise<PolicyRules>{
    return this.policyService.updateRule(workspaceId,policyId,ruleId,dto);
  }

  @ApiOperation({ summary: 'Remove a policy rule' })
  @Delete('/:policyId/versions/:versionId/rules/:ruleId')
  @UseGuards(JwtGuard)
  async RemovePolicyVersionRule(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('ruleId',ParseIntPipe)ruleId:number,@Body()dto:any):Promise<{deleted:boolean}>{
    return this.policyService.removeRule(workspaceId,policyId,ruleId,dto);
  }
}
