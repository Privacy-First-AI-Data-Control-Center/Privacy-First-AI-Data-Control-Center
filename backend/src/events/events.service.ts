import { Injectable, Logger, NotFoundException } from '@nestjs/common';
    import { InjectRepository } from '@nestjs/typeorm';
    import { Repository } from 'typeorm';
    import { Events } from './entities/event.entity.js';
    import { EventTypes } from './entities/event-type.entity.js';
    import { EventSources } from './entities/event-source.entity.js';
    import { EventAttributes } from './entities/event-attribute.entity.js';
    import { Workspaces } from '../workspace/entity/workspaces.js';
    import { WorkspaceStatus } from '../workspace/enum/workspace-status.js';
    import { Devices } from '../device/entity/devices.js';
    import { DeviceStatus } from '../device/enum/device-status.js';
    import { Integrations } from '../integrations/entities/integration.entity.js';
    import { IntegrationStatus } from '../integrations/enum/integration-status.js';
    import { ConnectorTypes } from '../connectors/entities/connector.entity.js';
    import { PolicyDecision } from '../policy-decision/entities/policy-decision.entity.js';
    import { EvaluationStatus } from '../policy-decision/enum/evaluation-status.enum.js';
    import { EnforcementAction } from '../enforcement-action/entities/enforcement-action.entity.js';
    import { EnforcementActionType, EnforcementOutcome } from '../enforcement-action/enum/enforcement-action.enum.js';
    import { PolicyVersions } from '../policy/entities/policy-version.entity.js';
    import { RuleEffect } from '../policy/enums/policy-rule.enum.js';
    import { Alerts } from '../alert/entities/alerts.entity.js';
    import { AlertType } from '../alert/enum/alert-type.js';
    import { AlertSeverity } from '../alert/enum/alert-severity.js';
    import { AlertStatus } from '../alert/enum/alert-status.js';
    import { RiskRule } from '../risk-rule/entities/risk-rule.entity.js';
    import { RiskSeverity } from '../risk-rule/enum/risk-severity.enum.js';
    import { RiskFinding } from '../risk-finding/entities/risk-finding.entity.js';
    import { SensitiveDataType } from '../sensitive-data-type/entity/SensitiveDataType.js';
    import { Severity } from '../sensitive-data-type/enum/Severity.js';
    import { Findings } from '../finding/entities/finding.entity.js';
    import { FindingStatus } from '../finding/enum/finding-status.enum.js';
    import { AgentEventBatchDto } from './dto/agent-event-batch.dto.js';
    import { QueryEventsDto } from './dto/query-event.dto.js';
  
    @Injectable()
    export class EventsService {
      private readonly logger = new Logger(EventsService.name);
  
      constructor(
        @InjectRepository(Events)
        private readonly eventRepo: Repository<Events>,
        @InjectRepository(EventTypes)
        private readonly eventTypeRepo: Repository<EventTypes>,
        @InjectRepository(EventSources)
        private readonly eventSourceRepo: Repository<EventSources>,
        @InjectRepository(EventAttributes)
        private readonly eventAttrRepo: Repository<EventAttributes>,
        @InjectRepository(Workspaces)
        private readonly workspaceRepo: Repository<Workspaces>,
        @InjectRepository(Devices)
        private readonly deviceRepo: Repository<Devices>,
        @InjectRepository(Integrations)
        private readonly integrationRepo: Repository<Integrations>,
        @InjectRepository(ConnectorTypes)
        private readonly connectorTypeRepo: Repository<ConnectorTypes>,
        @InjectRepository(PolicyDecision)
        private readonly policyDecisionRepo: Repository<PolicyDecision>,
        @InjectRepository(EnforcementAction)
        private readonly enforcementActionRepo: Repository<EnforcementAction>,
        @InjectRepository(PolicyVersions)
        private readonly policyVersionRepo: Repository<PolicyVersions>,
        @InjectRepository(Alerts)
        private readonly alertRepo: Repository<Alerts>,
        @InjectRepository(RiskRule)
        private readonly riskRuleRepo: Repository<RiskRule>,
        @InjectRepository(RiskFinding)
        private readonly riskFindingRepo: Repository<RiskFinding>,
        @InjectRepository(SensitiveDataType)
        private readonly sensitiveDataTypeRepo: Repository<SensitiveDataType>,
        @InjectRepository(Findings)
        private readonly findingRepo: Repository<Findings>,
      ) {}
  
     
      async processBatch(batchDto: AgentEventBatchDto) {
        const { deviceId, sentAt, events, workspaceId: requestedWorkspaceId } = batchDto;
        let acceptedCount = 0;
        let duplicateCount = 0;

        let device = await this.deviceRepo.findOne({
          where: { deviceName: deviceId },
          relations: { workspace: true },
        });

        let workspace: Workspaces | null = null;
        if (requestedWorkspaceId !== undefined) {
          workspace = await this.workspaceRepo.findOne({
            where: { id: requestedWorkspaceId },
          });
        }
        if (!workspace) {
          workspace = device?.workspace ?? null;
        }
        if (!workspace) {
          workspace = await this.workspaceRepo.findOne({
            where: { workspaceStatus: WorkspaceStatus.ACTIVE },
            order: { id: 'ASC' },
          });
        }
        if (!workspace) {
          workspace = await this.workspaceRepo.findOne({ order: { id: 'ASC' } });
        } 
  
        if (!workspace) { 
          throw new NotFoundException('No active workspace found to bind events to');
        }

        if (!device) {
          device = this.deviceRepo.create({
            workspace,
            deviceName: deviceId,
            hostName: deviceId,
            platform: process.platform,
            osVersion: 'local-agent',
            deviceStatus: DeviceStatus.ACTIVE,
            lastSeenAt: new Date(),
          });
          device = await this.deviceRepo.save(device);
        } else {
          if (requestedWorkspaceId !== undefined && device.workspace?.id !== workspace.id) {
            device.workspace = workspace;
          }
          device.lastSeenAt = new Date();
          await this.deviceRepo.save(device);
        }
  
        for (const item of events) { 
         
          const existing = await this.eventRepo.findOne({
            where: { dedupeKey: item.dedupeKey }, 
          }); 
          if (existing) {
            duplicateCount++; 
            continue;
          }
  
         
          let eventType = await this.eventTypeRepo.findOne({
            where: { code: item.eventType }, 
          });
          if (!eventType) {
            eventType = this.eventTypeRepo.create({
              code: item.eventType,
              name: item.eventType.replace(/[._]/g, ' ').toUpperCase(), 
              category: item.category || 'general',
            }); 
            eventType = await this.eventTypeRepo.save(eventType);
          } 
  
        
          let eventSource = await this.eventSourceRepo.findOne({
            where: { 
              sourceKind: item.source.sourceKind,
              sourceVersion: item.source.connectorVersion,
            },
          }); 
          if (!eventSource) {
            eventSource = this.eventSourceRepo.create({
              sourceKind: item.source.sourceKind, 
              sourceVersion: item.source.connectorVersion,
              sourceInstance: item.source.deviceId,
            });                                                                                                                                                                            
            eventSource = await this.eventSourceRepo.save(eventSource);                                                                                                                    
          }
  
          const attributes: EventAttributes[] = [];
          if (item.metadata && typeof item.metadata === 'object') {                                                                                                                        
            for (const [key, val] of Object.entries(item.metadata)) {                                                                                                                      
              if (val === undefined || val === null) continue;                                                                                                                             
              const attr = new EventAttributes();                                                                                                                                          
              attr.attributeKey = key;                                                                                                                                                     
              if (typeof val === 'number') {                                                                                                                                               
                attr.valueType = 'number';                                                                                                                                                 
                attr.numericValue = val;                                                                                                                                                   
              } else if (typeof val === 'boolean') {                                                                                                                                       
                attr.valueType = 'boolean';                                                                                                                                                
                attr.booleanValue = val;                                                                                                                                                   
              } else if (typeof val === 'string') {                                                                                                                                        
                attr.valueType = 'string';                                                                                                                                                 
                attr.stringValue = val;                                                                                                                                                    
              } else {                                                                                                                                                                     
                attr.valueType = 'json';                                                                                                                                                   
                attr.stringValue = JSON.stringify(val);                                                                                                                                    
              }                                                                                                                                                                            
              attr.isSensitive = false;                                                                                                                                                    
              attr.isRedacted = false;                                                                                                                                                     
              attributes.push(attr);                                                                                                                                                       
            }                                                                                                                                                                              
          }                                                                                                                                                                                
                                                                                                                                                                                           
                                                                                                                                  
          let integration: Integrations | null = null;
          const connectorSlug = item.source.integration || 'claude-code';
          const connectorType = await this.connectorTypeRepo.findOne({
            where: { slug: connectorSlug },
          });
          if (connectorType) {
            integration = await this.integrationRepo.findOne({
              where: {
                workspace: { id: workspace.id },
                connectorType: { id: connectorType.id },
                deviceId,
              },
            });
            if (!integration) {
              integration = this.integrationRepo.create({
                workspace,
                connectorType,
                deviceId,
                displayName: `${connectorType.displayName} (${deviceId})`,
                version: item.source.connectorVersion || '1.0.0',
                status: IntegrationStatus.ACTIVE,
                connectedAt: new Date(),
              });
              integration = await this.integrationRepo.save(integration);
            }
          }

          const eventRecord = this.eventRepo.create({
            eventId: item.eventId,
            dedupeKey: item.dedupeKey,
            workspace: workspace,
            integration: integration ?? undefined,
            eventType: eventType,
            eventSource: eventSource,
            deviceId: deviceId,
            occurredAt: new Date(item.occurredAt),                                                                                                                                         
            receivedAt: new Date(),                                                                                                                                                        
            severity: item.severity || 'INFO',                                                                                                                                             
            confidence: item.confidence || 'HIGH',                                                                                                                                         
            summary: item.summary,                                                                                                                                                         
            correlationId: item.correlationId ?? undefined,                                                                                                                                
            schemaVersion: item.schemaVersion || '1.0.0',                                                                                                                                  
            attributes: attributes,                                                                                                                                                        
          });                                                                                                                                                                              
                                                                                                                                                                                           
          const savedEvent = await this.eventRepo.save(eventRecord);

          const meta = item.metadata as Record<string, unknown> | undefined;
          const policyDecisionStr =
            typeof meta?.policyDecision === 'string' ? meta.policyDecision.toUpperCase() : null;
          if (policyDecisionStr === 'BLOCK' || policyDecisionStr === 'WARN') {
            let policyVersion: PolicyVersions | null = null;
            const pvId = Number(meta?.policyVersionId);
            const pId = Number(meta?.policyId);

            if (Number.isInteger(pvId) && pvId > 0) {
              policyVersion = await this.policyVersionRepo.findOne({ where: { id: pvId } });
            }
            if (!policyVersion && Number.isInteger(pId) && pId > 0) {
              policyVersion = await this.policyVersionRepo.findOne({
                where: { policy: { id: pId } },
                order: { versionNumber: 'DESC' },
              });
            }

            if (policyVersion) {
              const savedDecision = await this.policyDecisionRepo.save(
                this.policyDecisionRepo.create({
                  event: savedEvent,
                  policyVersion,
                  decision:
                    policyDecisionStr === 'BLOCK' ? RuleEffect.BLOCK : RuleEffect.WARN,
                  reason:
                    typeof meta?.policyReason === 'string' && meta.policyReason
                      ? meta.policyReason
                      : `Matched active policy (${policyDecisionStr})`,
                  evaluationStatus: EvaluationStatus.SUCCESS,
                  evaluationLatencyMs:
                    typeof meta?.evaluationLatencyMs === 'number'
                      ? Math.max(0, Math.round(meta.evaluationLatencyMs))
                      : 1,
                }),
              );

              await this.enforcementActionRepo.save(
                this.enforcementActionRepo.create({
                  policyDecision: savedDecision,
                  actionType:
                    policyDecisionStr === 'BLOCK'
                      ? EnforcementActionType.BLOCK
                      : EnforcementActionType.WARN,
                  outcome: EnforcementOutcome.SUCCESS,
                  evidence: {
                    policyId: meta?.policyId ?? null,
                    policyName: meta?.policyName ?? null,
                    ruleId: meta?.ruleId ?? null,
                    matchedValue: meta?.matchedValue ?? null,
                    deviceId,
                    connector: item.source.integration ?? 'claude-code',
                  },
                  performedAt: new Date(item.occurredAt),
                }),
              );
            }

            // Auto-create RiskFinding, SensitiveData Finding, and Alert so Dashboard shows real-time violations
            const isBlock = policyDecisionStr === 'BLOCK';
            const reasonText =
              typeof meta?.policyReason === 'string' && meta.policyReason
                ? meta.policyReason
                : `Policy violation (${policyDecisionStr})`;
            const matchedVal =
              typeof meta?.matchedValue === 'string' && meta.matchedValue
                ? meta.matchedValue
                : item.summary;
            const policyTitle =
              typeof meta?.policyName === 'string' && meta.policyName
                ? meta.policyName
                : 'Workspace Privacy Policy';

            let riskRule = await this.riskRuleRepo.findOne({
              where: {
                workspace: { id: workspace.id },
                name: 'Policy Violation — Sensitive Resource Access',
              },
            });
            if (!riskRule) {
              riskRule = await this.riskRuleRepo.save(
                this.riskRuleRepo.create({
                  workspace,
                  name: 'Policy Violation — Sensitive Resource Access',
                  condition: { source: 'local-agent-policy-engine' },
                  scoreDelta: 90,
                  severity: RiskSeverity.HIGH,
                  enabled: true,
                }),
              );
            }

            const savedRiskFinding = await this.riskFindingRepo.save(
              this.riskFindingRepo.create({
                event: savedEvent,
                riskRule,
                riskScore: isBlock ? 90 : 50,
                severity: isBlock ? RiskSeverity.HIGH : RiskSeverity.MEDIUM,
                explanation: `${policyTitle}: ${reasonText} (${matchedVal})`,
              }),
            );

            let sensitiveType = await this.sensitiveDataTypeRepo.findOne({
              where: { code: 'ENV_SECRET_FILE' },
            });
            if (!sensitiveType) {
              sensitiveType = await this.sensitiveDataTypeRepo.save(
                this.sensitiveDataTypeRepo.create({
                  code: 'ENV_SECRET_FILE',
                  name: 'Environment & Secret File',
                  detectorKing: 'POLICY_RULE',
                  severity: Severity.HIGH,
                  description: 'Detected access attempt to protected .env or credential files',
                }),
              );
            }

            await this.findingRepo.save(
              this.findingRepo.create({
                event: savedEvent,
                sensetiveDataType: sensitiveType,
                locationReference: matchedVal.slice(0, 250),
                confidence: 100,
                matchCount: 1,
                maskedEvidence: `[BLOCKED] ${matchedVal}`.slice(0, 250),
                status: FindingStatus.OPEN,
                recemmendation: 'Review AI agent access attempt and rotate secrets if exposed.',
                DetectedAt: new Date(item.occurredAt),
              }),
            );

            await this.alertRepo.save(
              this.alertRepo.create({
                workspace,
                workspaceId: workspace.id,
                riskFindingId: savedRiskFinding.id,
                assignedUser: null,
                assignedUserId: null,
                alertType: AlertType.POLICY_VIOLATION,
                title: `[${policyDecisionStr}] ${policyTitle}: ${matchedVal}`.slice(0, 200),
                severity: isBlock ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
                status: AlertStatus.OPEN,
                resolvedAt: null,
              }),
            );
          }

          acceptedCount++;                                                                                                                                                                 
        }                                                                                                                                                                                  
                                                                                                                                                                                           
        this.logger.log(`Ingested batch from ${deviceId}: ${acceptedCount} accepted, ${duplicateCount} duplicate`);                                                                        
                                                                                                                                                                                           
        return {                                                                                                                                                                           
          success: true,                                                                                                                                                                   
          deviceId,                                                                                                                                                                        
          acceptedCount,                                                                                                                                                                   
          duplicateCount,                                                                                                                                                                  
          totalReceived: events.length,                                                                                                                                                    
          sentAt,                                                                                                                                                                          
          processedAt: new Date().toISOString(),                                                                                                                                           
        };                                                                                                                                                                                 
      }                                                                                                                                                                                    
                                                                                                                                                                                           
                                                                                                                                                                              
      async findAll(workspaceId: number, query: QueryEventsDto) {                                                                                                                          
        const page = query.page ?? 1;                                                                                                                                                      
        const limit = query.limit ?? 50;                                                                                                                                                   
        const skip = (page - 1) * limit;                                                                                                                                                   
                                                                                                                                                                                           
        const qb = this.eventRepo                                                                                                                                                          
          .createQueryBuilder('event')                                                                                                                                                     
          .leftJoinAndSelect('event.eventType', 'eventType')                                                                                                                               
          .leftJoinAndSelect('event.eventSource', 'eventSource')                                                                                                                           
          .where('event.workspaceId = :workspaceId', { workspaceId });                                                                                                                     
                                                                                                                                                                                           
        if (query.severity) {                                                                                                                                                              
          qb.andWhere('event.severity = :severity', { severity: query.severity });                                                                                                         
        }                                                                                                                                                                                  
        if (query.eventType) {                                                                                                                                                             
          qb.andWhere('eventType.code = :code', { code: query.eventType });                                                                                                                
        }                                                                                                                                                                                  
        if (query.deviceId) {                                                                                                                                                              
          qb.andWhere('event.deviceId = :deviceId', { deviceId: query.deviceId });                                                                                                         
        }                                                                                                                                                                                  
        if (query.from) {                                                                                                                                                                  
          qb.andWhere('event.occurredAt >= :from', { from: new Date(query.from) });                                                                                                        
        }                                                                                                                                                                                  
        if (query.to) {                                                                                                                                                                    
          qb.andWhere('event.occurredAt <= :to', { to: new Date(query.to) });                                                                                                              
        }                                                                                                                                                                                  
                                                                                                                                                                                           
        qb.orderBy('event.occurredAt', 'DESC').skip(skip).take(limit);                                                                                                                     
                                                                                                                                                                                           
        const [items, total] = await qb.getManyAndCount();                                                                                                                                 
                                                                                                                                                                                           
        return {                                                                                                                                                                           
          data: items,                                                                                                                                                                     
          meta: {                                                                                                                                                                          
            total,                                                                                                                                                                         
            page,                                                                                                                                                                          
            limit,                                                                                                                                                                         
            totalPages: Math.ceil(total / limit),                                                                                                                                          
          },                                                                                                                                                                               
        };                                                                                                                                                                                 
      }                                                                                                                                                                                    
                                                                                                                                                                                           
                                                                                                                                                                                      
      async findOne(eventId: string) {                                                                                                                                                     
        const event = await this.eventRepo.findOne({                                                                                                                                       
          where: { eventId },                                                                                                                                                              
          relations: {eventType:true, eventSource:true, attributes:true},                                                                                                                           
        });                                                                                                                                                                                
        if (!event) {                                                                                                                                                                      
          throw new NotFoundException(`Event with ID ${eventId} not found`);                                                                                                               
        }                                                                                                                                                                                  
        return event;                                                                                                                                                                      
      } 

      async getEventAttributes (eventId : string ){
        const event =await this.eventRepo.findOne({
          where :{eventId} ,
          relations :{attributes:true}

        })
        if(!event)
        {
          throw new NotFoundException(`Event ID : ${eventId} not found `)
        }
       return event.attributes ;
      }
     async getEventTimeline(eventId :string){

      const event = await this.eventRepo.findOne({where : {eventId}})
       if(!event)
        {
          throw new NotFoundException(`Event ID : ${eventId} not found `)
        }

        const latencyMs = Math.max(0, event.receivedAt.getTime() - event.occurredAt.getTime());

        return({
          eventId :event.eventId ,
         occuredAt : event.occurredAt ,
         receivedAt :event.receivedAt  ,
         latencyMs ,
         schemaVersion: event.schemaVersion,
        })


     }

     async getStatistics (workspaceId :number ,from ?:string ,to? :string){
      const db = await this.eventRepo
      .createQueryBuilder('event')
      .leftJoin('event.eventType' ,'eventType')
      .where('event.workspaceId=:workspaceId' ,{workspaceId})
      if(from){
        db.andWhere(`event.occurredAt >= :from ` , { from : new Date (from)})}
         if (to) {db.andWhere('event.occurredAt <= :to', { to: new Date(to) });
      }
      const totalCount =await db.getCount()
      const categoryStats =await db.select('eventType.category' ,'category').addSelect('Count(event.id)' ,'count').groupBy('eventType.category').getRawMany()
      const severityStats = await db                                                                                                                                                     
          .select('event.severity', 'severity')                                                                                                                                            
          .addSelect('COUNT(event.id)', 'count')                                                                                                                                           
          .groupBy('event.severity')                                                                                                                                                       
          .getRawMany();


          return {                                                                                                                                                                           
          totalEvents: totalCount,                                                                                                                                                         
          byCategory: categoryStats,                                                                                                                                                       
          bySeverity: severityStats,                                                                                                                                                       
        };
     }
     async getEventTypes() {                                                                                                                                                              
        return this.eventTypeRepo.find({                                                                                                                                                   
          order: { category: 'ASC', code: 'ASC' },                                                                                                                                         
        });                                                                                                                                                                                
      }    
    } 