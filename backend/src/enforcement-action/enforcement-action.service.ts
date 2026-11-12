import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EnforcementAction } from './entities/enforcement-action.entity.js';
import { Repository } from 'typeorm';
import { PolicyDecision } from '../policy-decision/entities/policy-decision.entity.js';
import { QueryEnforcementActionDto } from './dto/query-enforcement-action.dto.js';

@Injectable()
export class EnforcementActionService {
    constructor(@InjectRepository(EnforcementAction) private readonly actionRepo: Repository<EnforcementAction>,
                @InjectRepository(PolicyDecision) private readonly policyDecisionRepo: Repository<PolicyDecision>) {}
    
    async findAll(workspaceId:number, query:QueryEnforcementActionDto): Promise<EnforcementAction[]> {
        try{
            return this.actionRepo.find({
                where: {
                    policyDecision: {
                        event: { workspace: { id: workspaceId } },
                        ...(query.policyDecisionId && { id: query.policyDecisionId })
                    },
                    ...(query.actionType && { actionType: query.actionType }),
                    ...(query.outcome && { outcome: query.outcome })
                },
                relations:{policyDecision:true},
                order:{performedAt:'DESC'},
            });
        }
        catch{
            throw new BadRequestException();
        }
    }
    async findOne(workspaceId:number, actionId:number): Promise<EnforcementAction> {
        try{
            const action = await this.actionRepo.findOne({
                where: {id:actionId,policyDecision:{event:{workspace:{id:workspaceId}}}},
                relations:{policyDecision:{event:true,policyVersion:{policy:true}}},
            });
            if (!action) {
                throw new BadRequestException('Enforcement action not found');
            }
            return action;
        }
        catch{
            throw new BadRequestException();
        }
    }
    async findByDecision(workspaceId:number, decisionId:number): Promise<EnforcementAction[]> {
        try{
            const decision = await this.policyDecisionRepo.findOne({
                where: {id:decisionId,event:{workspace:{id:workspaceId}}},
            });
            if (!decision) {
                throw new NotFoundException('Policy decision not found');
            }
            return this.actionRepo.find({
                where: {policyDecision: {id: decisionId}},
                order:{performedAt:'DESC'},
            });
        }
        catch{
            throw new BadRequestException();
        }
    }
}
