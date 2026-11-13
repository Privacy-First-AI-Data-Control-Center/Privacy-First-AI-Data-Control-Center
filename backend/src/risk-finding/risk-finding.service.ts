import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RiskFinding } from './entities/risk-finding.entity.js';
import { Repository } from 'typeorm';
import { QueryRiskFindingDto } from './dto/query-risk-finding.dto.js';
import { find, NotFoundError } from 'rxjs';

@Injectable()
export class RiskFindingService {
    constructor(@InjectRepository(RiskFinding) private readonly findingRepo:Repository<RiskFinding>){}

    async findAll(workspaceId:number,query:QueryRiskFindingDto):Promise<RiskFinding[]>{
        return this.findingRepo.find({
            where:{
                event:{
                    workspace:{id:workspaceId},
                    ...(query.eventId && {id:query.eventId}),
                },
                ...(query.riskRuleId && {riskRule:{id:query.riskRuleId}}),
                ...(query.severity && {severity:query.severity}),
            },
            relations:{event:true,riskRule:true},
            order:{createdAt:'DESC'},
        });
    }

    async findOne(workspaceId: number,findingId:number):Promise<RiskFinding>{
        const finding = await this.findingRepo.findOne({
            where:{id:findingId,event:{workspace:{id:workspaceId}}},
            relations:{event:true,riskRule:true},
            withDeleted:true,
        });
        if(!finding){
            throw new NotFoundException('Risk Not Found')
        }
        return finding;
    }
    async getStats(workspaceId:number){
        const findings = await this.findingRepo.find({
            where:{event:{workspace:{id:workspaceId}}},
        });
        const bySeverity = {LOW:0,MEDIUM:0,HIGH:0,CRITICAL:0};
        const trend:Record<string,number>={};
        let totalScore=0;

        for(const f of findings){
            bySeverity[f.severity]++;
            totalScore+=f.riskScore;
            const day = f.createdAt.toISOString().slice(0,10);
            trend[day] = (trend[day]??0)+1;
        }
        return {
            total:findings.length,
            avgScore:findings.length?Math.round(totalScore/findings.length):0,
            bySeverity,
            trend,
        };
    }
}
