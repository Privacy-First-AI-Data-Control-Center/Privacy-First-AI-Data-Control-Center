import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
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

@Controller('workspace/:workspaceId/policy')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}
  @Post()
  @UseGuards(JwtGuard)
  async CreatePolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Body()dto:CreatePolicyDto,@Req()req:any):Promise<Policies & {currentVersion:PolicyVersions}>{
    return await this.policyService.create(workspaceId,dto,req.user.id);
  }
  @Get()
  @UseGuards(JwtGuard)
  async PolicyList(@Param('workspaceId',ParseIntPipe)workspaceId:number, @Query('Status')status?:PolicyStatus):Promise<Policies[]>{
    return this.policyService.findAll(workspaceId,status);
  }
  @Get('/:policyId')
  @UseGuards(JwtGuard)
  async GetPolicyDetails(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number):Promise<Policies & {currentVersion:PolicyVersions}>{
    return this.policyService.findOne(workspaceId,policyId)
  }
  @Patch('/:policyId')
  @UseGuards(JwtGuard)
  async UpdatePolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Body()dto:partialUpdatePolicyDto,@Req()req:any):Promise<PolicyVersions>{
    return this.policyService.update(workspaceId,policyId,dto,req.user.id);
  }
  @Delete('/:policyId')
  @UseGuards(JwtGuard)
  async DeletePolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number){
    return this.policyService.delete(workspaceId,policyId);
  }
  @Post('/:policyId/enable')
  @UseGuards(JwtGuard)
  async EnablePolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number):Promise<Policies & { currentVersion: PolicyVersions | null }>{
    return this.policyService.enable(workspaceId,policyId);
  }
  @Post('/:policyId/disable')
  @UseGuards(JwtGuard)
  async ArchivePolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number):Promise<Policies & { currentVersion: PolicyVersions | null }>{
    return this.policyService.disable(workspaceId,policyId);
  }
  @Post('/:policyId/test')
  @UseGuards(JwtGuard)
  async TestPolicy(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Body()dto:TestPolicyDto):Promise<{versionId:number,decision:RuleEffect,reason:string,matchedRuleIds?:number[],}>{
    return this.policyService.test(workspaceId,policyId,dto);
  }
  @Get('/:policyId/versions')
  @UseGuards(JwtGuard)
  async GetPolicyVersions(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number):Promise<PolicyVersions[]>{
    return this.policyService.findVersions(workspaceId,policyId);
  }
  @Get('/:policyId/versions/:versionId')
  @UseGuards(JwtGuard)
  async GetPolicyVersionDetails(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('versionId',ParseIntPipe)versionId:number):Promise<PolicyVersions>{
    return this.policyService.findOneVersion(workspaceId,policyId,versionId);
  }
  @Post('/:policyId/versions/:versionId/active')
  @UseGuards(JwtGuard)
  async ActivePolicyVersion(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('versionId',ParseIntPipe)versionId:number,@Req()req:any):Promise<PolicyVersions>{
    return this.policyService.activeVersion(workspaceId,policyId,versionId,req.user.id);
  }
  @Get('/:policyId/versions/:versionId/rules')
  @UseGuards(JwtGuard)
  async GetPolicyVersionRules(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('versionId',ParseIntPipe)versionId:number):Promise<PolicyRules[]>{
    return this.policyService.findRules(workspaceId,policyId,versionId);
  }
  @Post('/:policyId/versions/:versionId/rules')
  @UseGuards(JwtGuard)
  async AddPolicyVersionRule(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('versionId',ParseIntPipe)versionId:number,@Body()dto:any):Promise<PolicyRules>{
    return this.policyService.addRule(workspaceId,policyId,versionId,dto);
  }
  @Patch('/:policyId/versions/:versionId/rules/:ruleId')
  @UseGuards(JwtGuard)
  async UpdatePolicyVersionRule(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('ruleId',ParseIntPipe)ruleId:number,@Body()dto:any):Promise<PolicyRules>{
    return this.policyService.updateRule(workspaceId,policyId,ruleId,dto);
  }
  @Delete('/:policyId/versions/:versionId/rules/:ruleId')
  @UseGuards(JwtGuard)
  async RemovePolicyVersionRule(@Param('workspaceId',ParseIntPipe)workspaceId:number,@Param('policyId',ParseIntPipe)policyId:number,@Param('ruleId',ParseIntPipe)ruleId:number,@Body()dto:any):Promise<{deleted:boolean}>{
    return this.policyService.removeRule(workspaceId,policyId,ruleId,dto);
  }
}
