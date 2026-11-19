import { Injectable, Logger } from '@nestjs/common';
    import { InjectRepository } from '@nestjs/typeorm'; 
    import { Cron, CronExpression } from '@nestjs/schedule';
    import {
      Between,
      LessThanOrEqual,
      MoreThanOrEqual,
      Repository,     
      type FindOperator,
    } from 'typeorm';   
    import { mkdir, writeFile } from 'fs/promises';
    import { join } from 'path';
    import { ReportRuns } from './entities/report-run.entity.js';
    import { ReportRunStatus } from './enum/report-run-status.enum.js';
    import { ReportFormat } from './enum/report-format.enum.js';       
    import { ReportType } from './enum/report-type.enum.js';    
    import { Events } from '../events/entities/event.entity.js';
    import { Findings } from '../finding/entities/finding.entity.js';
    import { RiskFinding } from '../risk-finding/entities/risk-finding.entity.js';
    import { PolicyDecision } from '../policy-decision/entities/policy-decision.entity.js';
    import { EnforcementAction } from '../enforcement-action/entities/enforcement-action.entity.js';
    import { Alerts } from '../alert/entities/alerts.entity.js';
    import { Integrations } from '../integrations/entities/integration.entity.js';
    import { IntegrationStatus } from '../integrations/enum/integration-status.js';
    import { AuditLogsService } from '../audit-logs/audit-logs.service.js';        
    import { ActorType } from '../audit-logs/enum/actor-type.js';          
    
    @Injectable()
    export class ReportJobService {
      private readonly logger = new Logger(ReportJobService.name);
    
      constructor(
        @InjectRepository(ReportRuns)
        private readonly runRepo: Repository<ReportRuns>,
        @InjectRepository(Events)
        private readonly eventRepo: Repository<Events>,
        @InjectRepository(Findings)
        private readonly findingRepo: Repository<Findings>,
        @InjectRepository(RiskFinding)
        private readonly riskFindingRepo: Repository<RiskFinding>,
        @InjectRepository(PolicyDecision)
        private readonly policyDecisionRepo: Repository<PolicyDecision>,
        @InjectRepository(EnforcementAction)
        private readonly enforcementActionRepo: Repository<EnforcementAction>,
        @InjectRepository(Alerts)
        private readonly alertRepo: Repository<Alerts>,
        @InjectRepository(Integrations)
        private readonly integrationRepo: Repository<Integrations>,
        private readonly auditLogsService: AuditLogsService,
      ) {}
  
      @Cron(CronExpression.EVERY_MINUTE)
      async processPendingRuns(): Promise<void> {
        const pendingRuns = await this.runRepo.find({ 
          where: { status: ReportRunStatus.PENDING }, 
          relations: { report: true }, 
          order: { createdAt: 'ASC' },
        });
  
        for (const run of pendingRuns) { 
          await this.executeRun(run);
        }
      }
  
      private buildDateFilter(from?: string, to?: string): FindOperator<Date> | undefined { 
        if (from && to) return Between(new Date(from), new Date(to));
        if (from) return MoreThanOrEqual(new Date(from));
        if (to) return LessThanOrEqual(new Date(to));
        return undefined;
      }
  
      private countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
        const counts: Record<string, number> = {};
        for (const item of items) {
          const key = getKey(item) || 'UNKNOWN';
          counts[key] = (counts[key] ?? 0) + 1;
        } 
        return counts;
      }
  
      private shouldInclude(
        reportType: ReportType,
        targetType: ReportType, 
        sectionName: string, 
        sections?: string[],
      ): boolean {
        if (sections && sections.length > 0) { 
          return sections.includes(sectionName);
        }
        return reportType === ReportType.EXECUTIVE_SUMMARY || reportType === targetType;
      }
  
      private async executeRun(run: ReportRuns): Promise<void> {
        run.status = ReportRunStatus.RUNNING; 
        run.startedAt = new Date();
        await this.runRepo.save(run);
  
        const report = run.report;
        const workspaceId = report.workspaceId; 
        const def = report.definition; 
        const dateFilter = this.buildDateFilter(def.from, def.to);
  
        try {
          const payload: Record<string, unknown> = { 
            meta: {
              reportId: report.id,
              runId: run.id, 
              title: report.title,
              reportType: def.reportType,
              format: def.format,
              workspaceId, 
              period: { from: def.from ?? null, to: def.to ?? null },
              generatedAt: new Date().toISOString(), 
            }, 
          };
  
          // 1. AI Tool Activity Summary (Events + EventTypes)
          if (this.shouldInclude(def.reportType, ReportType.ACTIVITY_SUMMARY, 'events', def.sections)) { 
            const events = await this.eventRepo.find({ 
              where: {
                workspace: { id: workspaceId }, 
                ...(dateFilter ? { occurredAt: dateFilter } : {}),
              },
              relations: { eventType: true },
            });
  
            const uniqueDevices = new Set(events.map((e) => e.deviceId));
            payload.activitySummary = {
              totalEvents: events.length,
              activeDevicesCount: uniqueDevices.size,
              bySeverity: this.countBy(events, (e) => e.severity),
              byEventType: this.countBy(events, (e) => e.eventType?.code ?? 'unknown'), 
              byCategory: this.countBy(events, (e) => e.eventType?.category ?? 'unknown'),
            }; 
          }
  
          // 2. Sensitive-Data & Risk Findings Summary (no raw secrets)
          if (
            this.shouldInclude(def.reportType, ReportType.PRIVACY_FINDINGS, 'findings', def.sections) 
          ) { 
            const findings = await this.findingRepo.find({
              where: { 
                event: { workspace: { id: workspaceId } },
                ...(dateFilter ? { createdAt: dateFilter } : {}), 
              }, 
            }); 
  
            const riskFindings = await this.riskFindingRepo.find({
              where: {
                event: { workspace: { id: workspaceId } }, 
                ...(dateFilter ? { createdAt: dateFilter } : {}), 
              },
            });
  
            const riskScores = riskFindings.map((rf) => rf.riskScore); 
            const avgRiskScore = 
              riskScores.length > 0
                ? Math.round(riskScores.reduce((sum, s) => sum + s, 0) / riskScores.length) 
                : 0;
  
            payload.privacyFindings = {
              totalFindings: findings.length, 
              findingsByStatus: this.countBy(findings, (f) => f.status), 
              totalRiskFindings: riskFindings.length, 
              riskBySeverity: this.countBy(riskFindings, (rf) => rf.severity),
              averageRiskScore: avgRiskScore,
              maxRiskScore: riskScores.length > 0 ? Math.max(...riskScores) : 0,
            }; 
          }
  
          // 3. Policy Decisions & Enforcement Outcomes
          if ( 
            this.shouldInclude(def.reportType, ReportType.POLICY_COMPLIANCE, 'policies', def.sections)
          ) {
            const decisions = await this.policyDecisionRepo.find({
              where: { 
                event: { workspace: { id: workspaceId } },
                ...(dateFilter ? { evaluatedAt: dateFilter } : {}), 
              }, 
            }); 
  
            const actions = await this.enforcementActionRepo.find({
              where: { 
                policyDecision: { event: { workspace: { id: workspaceId } } },
                ...(dateFilter ? { performedAt: dateFilter } : {}),
              },
            });
  
            payload.policyOutcomes = {
              totalDecisions: decisions.length,
              byDecision: this.countBy(decisions, (d) => d.decision), 
              byEvaluationStatus: this.countBy(decisions, (d) => d.evaluationStatus),
              totalEnforcementActions: actions.length, 
              byActionType: this.countBy(actions, (a) => a.actionType),
              byOutcome: this.countBy(actions, (a) => a.outcome),
            };
          }
  
          // 4. Alerts Summary
          if (
            this.shouldInclude(def.reportType, ReportType.EXECUTIVE_SUMMARY, 'alerts', def.sections)
          ) {
            const alerts = await this.alertRepo.find({
              where: {
                workspaceId,
                ...(dateFilter ? { createdAt: dateFilter } : {}),
              },
            });
  
            payload.alertsSummary = {
              totalAlerts: alerts.length,
              byStatus: this.countBy(alerts, (a) => a.status),
              bySeverity: this.countBy(alerts, (a) => a.severity), 
              byType: this.countBy(alerts, (a) => a.alertType), 
            }; 
          }
  
          // 5. Connector Coverage & Monitoring Gaps
          if (
            this.shouldInclude( 
              def.reportType, 
              ReportType.CONNECTOR_COVERAGE,
              'integrations',
              def.sections,
            )
          ) {
            const integrations = await this.integrationRepo.find({
              where: { workspace: { id: workspaceId } }, 
              relations: { connectorType: true, capabilities: true },
            });
  
            payload.connectorCoverage = {
              totalIntegrations: integrations.length, 
              activeIntegrations: integrations.filter((i) => i.status === IntegrationStatus.ACTIVE) 
                .length,
              disconnectedIntegrations: integrations.filter(
                (i) => i.status === IntegrationStatus.DISCONNECTED,
              ).length,
              connectors: integrations.map((i) => ({
                id: i.id,
                displayName: i.displayName,
                connectorSlug: i.connectorType?.slug ?? 'unknown',
                status: i.status,
                capabilitiesCount: i.capabilities?.length ?? 0,
              })),
              coverageNote:
                'Coverage reflects observed telemetry from active connectors only. Missing events do not prove no activity occurred.',
            };
          }
  
          // Save output file (JSON or CSV) to backend/reports/
          const outputDir = join(process.cwd(), 'reports'); 
          await mkdir(outputDir, { recursive: true });
  
          const isCsv = def.format === ReportFormat.CSV;
          const filePath = join(outputDir, `report-${report.id}-run-${run.id}.${isCsv ? 'csv' : 'json'}`);
  
          if (isCsv) { 
            await writeFile(filePath, this.toCsv(payload), 'utf-8');
          } else {
            await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
          }
  
          run.status = ReportRunStatus.COMPLETED;
          run.resultReference = filePath; 
          run.completedAt = new Date(); 
          run.errorCode = null;
          await this.runRepo.save(run);
  
          await this.auditLogsService.log({
            workspaceId,
            actorType: ActorType.SYSTEM,
            action: 'REPORT_RUN_COMPLETED',
            targetType: 'REPORT_RUN',
            targetId: run.id,
            metadata: { reportId: report.id, filePath },
          }); 
        } catch (err) {
          this.logger.error(`Report run #${run.id} failed`, err); 
          run.status = ReportRunStatus.FAILED;
          run.errorCode = err instanceof Error ? err.message.slice(0, 250) : 'REPORT_GENERATION_FAILED'; 
          run.completedAt = new Date(); 
          await this.runRepo.save(run); 
  
          await this.auditLogsService.log({
            workspaceId, 
            actorType: ActorType.SYSTEM, 
            action: 'REPORT_RUN_FAILED',
            targetType: 'REPORT_RUN',
            targetId: run.id,                                                                                                                                                              
            metadata: { reportId: report.id, errorCode: run.errorCode },                                                                                                                   
          });                                                                                                                                                                              
        }                                                                                                                                                                                  
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      private toCsv(payload: Record<string, unknown>): string {                                                                                                                            
        const lines: string[] = ['section,metric,value'];                                                                                                                                  
        const escapeCsv = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;                                                                                                  
                                                                                                                                                                                           
        for (const [section, data] of Object.entries(payload)) {                                                                                                                           
          if (data && typeof data === 'object') {                                                                                                                                          
            for (const [metric, value] of Object.entries(data as Record<string, unknown>)) {                                                                                               
              const formatted =                                                                                                                                                            
                value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');                                                                                          
              lines.push(`${escapeCsv(section)},${escapeCsv(metric)},${escapeCsv(formatted)}`);                                                                                            
            }                                                                                                                                                                              
          }                                                                                                                                                                                
        }                                                                                                                                                                                  
                                                                                                                                                                                           
        return lines.join('\n');                                                                                                                                                           
      }                                                                                                                                                                                    
    } 