import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Policies } from './entities/policy.entity.js';
import { privateDecrypt } from 'crypto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PolicyVersions } from './entities/policy-version.entity.js';
import { PolicyRules } from './entities/policy-rule.entity.js';
import { CreatePolicyDto } from './dto/create-policy.dto.js';
import { PolicyStatus } from './enums/policy-status.enum.js';
import { CreatePolicyRuleDto } from './dto/create-policy-rule.dto.js';
import { updatePolicyDto } from './dto/update-policy.dto.js';
import { updatePolicyRuleDto } from './dto/update-policy-rule.dto.js';
import { TestPolicyDto } from './dto/test-policy.dto.js';
import { RuleEffect, RuleType } from './enums/policy-rule.enum.js';
import { workspaceevents } from 'googleapis/build/src/apis/workspaceevents/index.js';
import { partialUpdatePolicyDto } from './dto/partial-update-policy.dto.js';

const CONDITION_KEY = {
  [RuleType.SENSITIVE_DATA]: 'sensitiveTypes',
  [RuleType.EVENT_TYPE]: 'eventTypes',
  [RuleType.INTEGRATION]: 'integrations',
};

@Injectable()
export class PolicyService {
    constructor(
        @InjectRepository(Policies) private policyRepo:Repository<Policies>,
        @InjectRepository(PolicyVersions) private versionRepo:Repository<PolicyVersions>,
        @InjectRepository(PolicyRules) private ruleRepo:Repository<PolicyRules>, 
    ){}
    async create(worksapceId:number,dto:CreatePolicyDto,userId:number):Promise<Policies & {currentVersion:PolicyVersions}>{
        const policy = await this.policyRepo.save({
            workspace:{id:worksapceId},
            Users:{id:userId},
            name:dto.name,
            description:dto.description,
            priority:dto.priority??0,
        });
        await this.createVersion(policy.id,1,dto.rules??[],userId);
        return this.findOne(worksapceId,policy.id);

    }
    async findAll(workspaceId:number,status?:PolicyStatus):Promise<Policies[]>{
        return this.policyRepo.find({
            where: {workspace:{id:workspaceId},...(status && {status})},
            order:{priority:'DESC',createdAt:'DESC'},
        });
    }
    async findOne(worksapceId:number,policyId:number):Promise<Policies & {currentVersion:PolicyVersions}>{
        const policy = await this.policyRepo.findOne({
            where:{id:policyId,workspace:{id:worksapceId}},
        });
        if(!policy){
            throw new NotFoundException('Policy not Found');
        }
        const currv = await this.getLatestVersion(policyId);
        return {...policy,currentVersion:currv}
    }
    async update(worksapceId:number,policyId:number,dto:partialUpdatePolicyDto,userId:number):Promise<PolicyVersions>{
        const policy = await this.findOne(worksapceId,policyId);
        if(policy.status === PolicyStatus.ARCHIVED){
            throw new BadRequestException('Policy is archived');
        }
        const {rules, ...fields} = dto;
        await this.policyRepo.save({id:policyId,...fields});
        const latest = policy.currentVersion;
        const newRules = rules??this.copyRules(latest?.policy_rules??[]);
        return this.createVersion(policyId,(latest?.versionNumber??0)+1,newRules,userId);
    }
    async delete(worksapceId:number,policyId:number):Promise<void>{
        await this.findOne(worksapceId,policyId);
        await this.policyRepo.update(policyId,{status:PolicyStatus.ARCHIVED});
        await this.policyRepo.softDelete(policyId);
    }
    async archive(worksapceId:number,policyId:number):Promise<Policies & { currentVersion: PolicyVersions | null }>{
        await this.findOne(worksapceId,policyId);
        await this.policyRepo.update(policyId,{status:PolicyStatus.ARCHIVED});
        return this.findOne(worksapceId,policyId);
    }
    async enable(worksapceId:number,policyId:number):Promise<Policies & { currentVersion: PolicyVersions | null }>{
        const policy = await this.findOne(worksapceId,policyId);
        if(policy.status===PolicyStatus.ARCHIVED){
            throw new BadRequestException('Policy is archived')
        }
        await this.policyRepo.update(policyId,{status:PolicyStatus.ACTIVE});
        return this.findOne(worksapceId,policyId);
    }
    async disable(worksapceId:number,policyId:number):Promise<Policies & { currentVersion: PolicyVersions | null }>{
        const policy = await this.findOne(worksapceId,policyId);
        if(policy.status===PolicyStatus.ARCHIVED){
            throw new BadRequestException('Policy is archived')
        }
        await this.policyRepo.update(policyId,{status:PolicyStatus.DISABLED});
        return this.findOne(worksapceId,policyId);
    }

    //versions
    async findVersions(worksapceId:number,policyId:number):Promise<PolicyVersions[]>{
        try{
            return await this.versionRepo.find({
                where:{policy:{id:policyId,workspace:{id:worksapceId}}},
                order:{versionNumber:'DESC'},
            });
        }
        catch{
            throw new BadRequestException()
        }
    }
    async findOneVersion(worksapceId:number,policyId:number,VersionId:number):Promise<PolicyVersions>{
        const version = await this.versionRepo.findOne({
            where:{id:VersionId,policy:{id:policyId,workspace:{id:worksapceId}}},
            relations:{policy_rules:true},
            order:{policy_rules:{position:'ASC'}},
        })
        if(!version){
            throw new NotFoundException('Policy Version can not be Found');
        }
        return version;
    }

    async activeVersion(workspaceId:number,policyId:number,versionId:number,userId:number):Promise <PolicyVersions>{
        const policy = await this.findOne(workspaceId,policyId);
        if(policy.status == PolicyStatus.ARCHIVED) throw new BadRequestException('Policy is archived');
        const version = await this.findOneVersion(workspaceId,policyId,versionId);
        const latest = policy.currentVersion;
        if(latest.id == version.id) return latest;
        //not finished
        return this.createVersion(policyId,latest.versionNumber+1,this.copyRules(version.policy_rules),userId);
    }
    async test(worksapceId:number,policyId:number,dto:TestPolicyDto):Promise<{versionId:number,decision:RuleEffect,reason:string,matchedRuleIds?:number[],}>{
        const policy = await this.findOne(worksapceId,policyId);
        const version = dto.versionId ? await this.findOneVersion(worksapceId,policyId,dto.versionId):policy.currentVersion;
        if(!version){
            throw new BadRequestException('No Version Exitst!');
        }
        const matched = version.policy_rules.filter((rule)=>rule.enabled && this.matches(rule,dto));
        if(matched.length === 0){
            return {versionId:version.id,decision:RuleEffect.ALLOW,reason:'No rule matched'};
        }
        const order = [RuleEffect.ALLOW, RuleEffect.WARN, RuleEffect.REDACT, RuleEffect.REQUIRE_APPROVAL, RuleEffect.BLOCK];
        const winner = matched.reduce((a,b)=>(order.indexOf(b.effect) > order.indexOf(a.effect)?b:a));
        return {versionId:version.id,decision:winner.effect,
            reason:`Rule ${winner.id} (${winner.ruleType}) matched`,
            matchedRuleIds:matched.map((r)=>r.id),
        }
    }
    ////rules
    async findRules(worksapceId:number,policyId:number,versionId:number):Promise<PolicyRules[]>{
        const version = await this.findOneVersion(worksapceId,policyId,versionId);
        return version.policy_rules;
    }
    async addRule(workspaceId:number,policyId:number,versionId:number,dto:CreatePolicyRuleDto):Promise<PolicyRules>{
        const version = await this.findOneVersion(workspaceId,policyId,versionId);
        await this.checkEditable(workspaceId,policyId,versionId);
        const rule = await this.ruleRepo.save({
            ...dto,
            position:dto.position ?? version.policy_rules.length,
            policyVersion:{id:versionId},
        });
        await this.saveSnapshot(versionId);
        return rule;
    }

    async updateRule(workspaceId:number,policyId:number,ruleId:number,dto:updatePolicyRuleDto):Promise<PolicyRules>{
        const rule = await this.findRule(workspaceId,policyId,ruleId);
        await this.checkEditable(workspaceId,policyId,rule.policyVersion.id);
        const srule = await this.ruleRepo.save({...rule,...dto});
        await this.saveSnapshot(rule.policyVersion.id);
        return srule;
    }
    async removeRule(workspaceId:number,policyId:number,ruleId:number,dto:updatePolicyRuleDto):Promise<{deleted:boolean}>{
        const rule = await this.findRule(workspaceId,policyId,ruleId);
        await this.checkEditable(workspaceId,policyId,rule.policyVersion.id);
        await this.ruleRepo.delete(ruleId);
        await this.saveSnapshot(rule.policyVersion.id);
        return {deleted:true};
    }

    //extrs
    private async getLatestVersion(policyId:number):Promise<PolicyVersions>{
        const version= await this.versionRepo.findOne({
            where:{policy:{id:policyId}},
            relations:{policy_rules:true},
            order:{versionNumber:'DESC',policy_rules:{position:'ASC'}},
        })
        if(!version){
            throw new NotFoundException()
        }
        return version;
    }
    private async checkEditable(worksapceId:number,policyId:number,versionId:number):Promise<void>{
        const policy = await this.findOne(worksapceId,policyId);
        if(policy.status !== PolicyStatus.DISABLED){
            throw new ConflictException('Disable the policy first')
        }
        if(policy.currentVersion?.id !== versionId){
            throw new ConflictException('Only the Latest version can ve changed');
        }
    }
    private async createVersion(policyId:number,versionNumber:number,rules:CreatePolicyRuleDto[],userId:number):Promise<PolicyVersions>{
        const version = await this.versionRepo.save({
            policy:{id:policyId},
            versionNumber,
            Users:{id:userId},
            definitionSnapshot:{rules},
        });
        await this.ruleRepo.save(
            rules.map((rule,index)=>({
                ...rule,
                position:rule.position??index,
                policyVersion:{id:version.id},
            })),
        );
        return this.versionRepo.findOneOrFail({
            where:{id:version.id},
            relations:{policy_rules:true},
        });
    }
    private async saveSnapshot(versionId:number):Promise<void>{
        const rules = await this.ruleRepo.find({
            where:{policyVersion:{id:versionId}},
            order:{position:'ASC'},
        });
        await this.versionRepo.save({id:versionId,definitionSnapshot:{rules}});
    }
    private async findRule(worksapceId:number,policyId:number,ruleId:number):Promise<PolicyRules>{
        const rule = await this.ruleRepo.findOne({
            where:{id:ruleId,policyVersion:{policy:{id:policyId,workspace:{id:worksapceId}}}},
            relations:{policyVersion:true},
        });
        if(!rule){
            throw new NotFoundException()
        }
        return rule;
    }
    private copyRules(rules:PolicyRules[]):CreatePolicyRuleDto[]{
        return rules.map((r)=>({
            ruleType:r.ruleType,
            condition:r.condition,
            effect:r.effect,
            actionConfig:r.actionConfig??undefined,
            enabled:r.enabled,
            position:r.position,
        }));
    }
    private matches(rule:PolicyRules,input:TestPolicyDto):boolean{
        const values = (rule.condition[CONDITION_KEY[rule.ruleType]] ?? []) as string[];
        if (rule.ruleType === RuleType.SENSITIVE_DATA) {
        return (input.sensitiveType ?? []).some((type) => values.includes(type));
        }
        if (rule.ruleType === RuleType.EVENT_TYPE) {
        return values.includes(input.eventType ?? '');
        }
        return values.includes(input.integration ?? '');
    }
}
