import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PolicyDecision } from './entities/policy-decision.entity.js';
import { privateDecrypt } from 'crypto';
import { Repository } from 'typeorm';
import { Events } from '../events/entities/event.entity.js';
import { QueryPolicyDecisionDto } from './dto/query-policy-decision.dto.js';

@Injectable()
export class PolicyDecisionService {
    constructor(@InjectRepository(PolicyDecision) private readonly decisionRepo:Repository<PolicyDecision>){}
    async findAll(workspaceId:number,query:QueryPolicyDecisionDto):Promise<PolicyDecision[]>{
        return this.decisionRepo.find({
            where:{
                event:{workspace:{id:workspaceId},...(query.eventId && {id:query.eventId})},
                ...(query.decision && {decision:query.decision}),
                ...(query.evaluationStatus && {evaluationStatus:query.evaluationStatus}),
                ...(query.policyId && {policyVersion:{policy:{id:query.policyId}}}),
                
            },
            relations:{event:true,policyVersion:{policy:true}},
            order:{evaluatedAt:'DESC'}
        });
    }
    async findOne(workspaceId:number,decisionId:number):Promise<PolicyDecision>{
        const decision = await this.decisionRepo.findOne({
            where:{id:decisionId,event:{workspace:{id:workspaceId}}},
            relations:{event:true,policyVersion:{policy:true}},
        });
        if (!decision) {
            throw new NotFoundException('Decision not found');
        }
        return decision;
    }
}
