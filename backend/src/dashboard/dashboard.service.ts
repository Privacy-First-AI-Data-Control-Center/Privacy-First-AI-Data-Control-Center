import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Events } from '../events/entities/event.entity.js';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Alerts } from '../alert/entities/alerts.entity.js';
import { Findings } from '../finding/entities/finding.entity.js';
import { RiskFindingService } from '../risk-finding/risk-finding.service.js';
import { RiskFinding } from '../risk-finding/entities/risk-finding.entity.js';
import { PolicyDecision } from '../policy-decision/entities/policy-decision.entity.js';
import { Integrations } from '../integrations/entities/integration.entity.js';
import { AlertStatus } from '../alert/enum/alert-status.js';
import { IntegrationStatus } from '../integrations/enum/integration-status.js';
import { AlertSeverity } from '../alert/enum/alert-severity.js';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Events) private eventRepo: Repository<Events>,
           @InjectRepository(Alerts) private alertRepo: Repository<Alerts>,
     @InjectRepository(Findings) private findingRepo: Repository<Findings>,
          @InjectRepository(RiskFinding) private riskRepo: Repository<RiskFinding>,
         @InjectRepository(PolicyDecision) private decisionRepo: Repository<PolicyDecision>,
    @InjectRepository(Integrations) private integrationRepo: Repository<Integrations>
    ){}

    async getOverview(workspaceId:number)
    {
        const onedayago= new Date(Date.now()-24*60*60*1000)

        const totalEvent= await this.eventRepo.count({where:{id:workspaceId}})

        const eventLast24h=await this.eventRepo.count({
            where:{workspace:
                {
                    id:workspaceId
                }, occurredAt:MoreThanOrEqual(onedayago)
            }
        });

        const lastEvent= await this.eventRepo.findOne(
            {
                where:
                {
                    workspace:{id:workspaceId},
                
                },
                order:
                {
                    occurredAt:'DESC'
                }, select:{id:true, occurredAt:true}
            }
        );

        const openAlerts= await this.alertRepo.count( 
            {
                where:{workspaceId:workspaceId, status:AlertStatus.OPEN}
            }
        );

        const openFindings= await this.findingRepo.count(
            {
                where:{event:{workspace:{id:workspaceId}}, status:'OPEN'}
            }
        );

        const risk= await this.riskRepo.find(
            {
                where:{event:{workspace:{id:workspaceId}}},
                select:{id:true,severity:true}
            }
        );

        let highrisk=0
        for(const r of risk)
        {
           const l = String(r.severity).toUpperCase();
           if(l=='HIGH'|| l=='CRITICAL')
           {
             highrisk++;
           }
        }

        const activeIntegration= await this.integrationRepo.count(
            {
                where:{workspace:{id:workspaceId},status:IntegrationStatus.ACTIVE}
            }
        )
        return {
            events:{
                total: totalEvent,
                last24Hours: eventLast24h,
                lastEventAt: lastEvent ? lastEvent.occurredAt : null
            },
            openAlerts: openAlerts,
            openFindings: openFindings,
            highRiskFindings: highrisk,
            activeIntegrations: activeIntegration,
           
        };
    }

    async getActivity(workspaceId:number)
    {
        const recentEvents = await this.eventRepo.find({
            where:{ workspace:{ id: workspaceId } },
            relations:{ eventType: true },
            select:{
                id: true,
                occurredAt: true,
                deviceId: true,
                severity: true,
                summary: true,
                eventType:{ code: true, category: true }
            },
            order:{ occurredAt: 'DESC' },
            take: 20
        });

         const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekEvents = await this.eventRepo.find({
            where:{ workspace:{ id: workspaceId }, occurredAt: MoreThanOrEqual(sevenDaysAgo) },
            relations:{ eventType: true },
            select:{ id: true, occurredAt: true, eventType:{ category: true } }
        });
        const perDay: any = {};
        const perCategory: any = {};
        for(const event of weekEvents){
            const day = new Date(event.occurredAt).toISOString().slice(0, 10);
            perDay[day] = (perDay[day] ?? 0) + 1;

            const category = event.eventType?.category ?? 'unknown';
            perCategory[category] = (perCategory[category] ?? 0) + 1;
        }

        return {
            recentEvents: recentEvents,
            last7Days:{
                total: weekEvents.length,
                perDay: perDay,
                perCategory: perCategory
            }
        };
    }

    async getRisk(workspaceId:number)
    {
        const risks = await this.riskRepo.find({
            where:{ event:{ workspace:{ id: workspaceId } } },
            select:{ id: true, severity: true, riskScore: true }
        });

        const bySeverity: any = {};
        let totalScore = 0;
        for(const risk of risks){
            bySeverity[risk.severity] = (bySeverity[risk.severity] ?? 0) + 1;
            totalScore += risk.riskScore;
        }

       
        const topRisks = await this.riskRepo.find({
            where:{ event:{ workspace:{ id: workspaceId } } },
            relations:{ event: true },
            select:{
                id: true,
                riskScore: true,
                severity: true,
                explanation: true,
                createdAt: true,
                event:{ id: true, summary: true, occurredAt: true }
            },
            order:{ riskScore: 'DESC' },
            take: 5
        });

        return {
            total: risks.length,
            averageScore: risks.length > 0 ? Math.round(totalScore / risks.length) : null,
            bySeverity: bySeverity,
            topRisks: topRisks
        };
    }

    async getSensitiveData(workspaceId:number)
    {
        const findings = await this.findingRepo.find({
        where:{
            event:{
                workspace:{ id: workspaceId }
            }
        },
        relations:{
            sensetiveDataType: true
        },
        select:{
            id: true,
            status: true,
            sensetiveDataType:{ name: true }
        }
        });

         const byType: any = {};
         const byStatus: any = {};
         for(const finding of findings)
         {
            const typeName = finding.sensetiveDataType.name;

             if(byType[typeName] == null)
             {
                byType[typeName] = 0;
             }
             byType[typeName]++;

             if(byStatus[finding.status] == null)
             {
                byStatus[finding.status] = 0;
             }
             byStatus[finding.status]++;
         }

         return {
        totalFindings: findings.length,
        byType: byType,
        byStatus: byStatus
        };



    }

    async getAlert(workspaceId:number)
    {
        const total = await this.alertRepo.count({ where:{ workspaceId: workspaceId } });

        const byStatus = {
            open: await this.alertRepo.count({ where:{ workspaceId: workspaceId, status: AlertStatus.OPEN } }),
            acknowledged: await this.alertRepo.count({ where:{ workspaceId: workspaceId, status: AlertStatus.ACKNOWLEDGED } }),
            resolved: await this.alertRepo.count({ where:{ workspaceId: workspaceId, status: AlertStatus.RESOLVED } })
        };

        const bySeverity = {
            critical: await this.alertRepo.count({ where:{ workspaceId: workspaceId, severity: AlertSeverity.CRITICAL } }),
            high: await this.alertRepo.count({ where:{ workspaceId: workspaceId, severity: AlertSeverity.HIGH } }),
            medium: await this.alertRepo.count({ where:{ workspaceId: workspaceId, severity: AlertSeverity.MEDIUM } }),
            low: await this.alertRepo.count({ where:{ workspaceId: workspaceId, severity: AlertSeverity.LOW } }),
            info: await this.alertRepo.count({ where:{ workspaceId: workspaceId, severity: AlertSeverity.INFO } })
        };

        const recentOpen = await this.alertRepo.find({
            where:{ workspaceId: workspaceId, status: AlertStatus.OPEN },
            order:{ createdAt: 'DESC' },
            take: 5
        });

        return {
            total: total,
            byStatus: byStatus,
            bySeverity: bySeverity,
            recentOpen: recentOpen
        };
    }

    async getPolicyPerformance(workspaceId: number)
    {
        const decisions = await this.decisionRepo.find({
        where:{
            event:{
                workspace:{ id: workspaceId }
            }
        },
        select:{
            id: true,
            decision: true,
            evaluationLatencyMs: true
        }
       });

        const byDecision: any = {};
        let totalLatency = 0;

        for(const item of decisions)
        {
            if(byDecision[item.decision] == null)
            {
               byDecision[item.decision] = 0;
            }
           byDecision[item.decision]++;

           totalLatency =totalLatency+ item.evaluationLatencyMs;
        }
         let averageLatencyMs = 0;
         if(decisions.length > 0)
         {
           averageLatencyMs = Math.round(totalLatency / decisions.length);
         }

         return {
         totalDecisions: decisions.length,
         byDecision: byDecision,
         averageLatencyMs: averageLatencyMs
         };
    }
}
