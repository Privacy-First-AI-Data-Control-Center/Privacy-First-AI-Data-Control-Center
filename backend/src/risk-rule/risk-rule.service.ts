import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RiskRule } from './entities/risk-rule.entity.js';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { CreateRiskRuleDto } from './dto/create-risk-rule.dto.js';
import { QueryRiskRuleDto } from './dto/query-risk-rule.dto.js';
import { UpdateRiskRuleDto } from './dto/update-risk-rule.dto.js';

@Injectable()
export class RiskRuleService {
    constructor(@InjectRepository(RiskRule) private readonly riskRuleRepo:Repository<RiskRule>) {}
    async create(workspaceId:number,dto:CreateRiskRuleDto):Promise<RiskRule>{
        const exist = await this.riskRuleRepo.findOne({
            where:{name:dto.name,workspace:{id:workspaceId}},
        });
        if(exist){
            throw new ConflictException('A risk rule with this name alredy exists');
        }
        const rule = this.riskRuleRepo.create({...dto,workspace:{id:workspaceId}});
        if(!rule){
            throw new Error('Failed to create risk rule');
        }
        return this.riskRuleRepo.save(rule);
        
    }
    async findAll(workspaceId:number,query:QueryRiskRuleDto):Promise<RiskRule[]>{
        return this.riskRuleRepo.find({
            where:{
                workspace:{id:workspaceId},
                ...(query.severity && {severity:query.severity}),
                ...(query.enabled !== undefined && {enabled:query.enabled}),
            },
            order:{createdAt:'DESC'}
        });
    }
    async findOne(workspaceId:number,riskRuleId:number):Promise<RiskRule>{
        const rule = await this.riskRuleRepo.findOne({
            where:{
                id:riskRuleId,
                workspace:{id:workspaceId}
            }
        });
        if(!rule){
            throw new NotFoundException('Risk rule not found');
        }
        return rule;
    }
    async update(workspaceId:number,riskRuleId:number,dto:UpdateRiskRuleDto):Promise<RiskRule>{
        const rule = await this.findOne(workspaceId,riskRuleId);
        if(dto.name && dto.name !== rule.name){
            const exist = await this.riskRuleRepo.findOne({where:{name:dto.name,workspace:{id:workspaceId}}});
            if(exist){
                throw new ConflictException('A risk rule with this name alredy exist');
            }
        }
        Object.assign(rule,dto);
        return this.riskRuleRepo.save(rule);
    }

    async delete(workspaceId:number,riskRuleId:number):Promise<{deleted:true}>{
        const rule = await this.findOne(workspaceId,riskRuleId);
        await this.riskRuleRepo.update(rule.id,{enabled:false});
        await this.riskRuleRepo.softDelete(rule.id);
        return {deleted:true}
    }
}
