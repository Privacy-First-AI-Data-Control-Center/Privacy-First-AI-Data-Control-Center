import { Injectable, Logger, NotFoundException } from '@nestjs/common';
    import { InjectRepository } from '@nestjs/typeorm';
    import { Repository } from 'typeorm';
    import { Events } from './entities/event.entity.js';
    import { EventTypes } from './entities/event-type.entity.js';
    import { EventSources } from './entities/event-source.entity.js';
    import { EventAttributes } from './entities/event-attribute.entity.js';
    import { Workspaces } from '../workspace/entity/workspaces.js';
    import { WorkspaceStatus } from '../workspace/enum/workspace-status.js';
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
      ) {}
  
     
      async processBatch(batchDto: AgentEventBatchDto) {
        const { deviceId, sentAt, events } = batchDto;
        let acceptedCount = 0;
        let duplicateCount = 0;
  
       
        let workspace = await this.workspaceRepo.findOne({
          where: { workspaceStatus: WorkspaceStatus.ACTIVE },
          order: { id: 'ASC' },
        });
        if (!workspace) {
          workspace = await this.workspaceRepo.findOne({ order: { id: 'ASC' } });
        } 
  
        if (!workspace) { 
          throw new NotFoundException('No active workspace found to bind events to');
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
                                                                                                                                                                                           
                                                                                                                                  
          const eventRecord = this.eventRepo.create({                                                                                                                                      
            eventId: item.eventId,                                                                                                                                                         
            dedupeKey: item.dedupeKey,                                                                                                                                                     
            workspace: workspace,                                                                                                                                                          
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
                                                                                                                                                                                           
          await this.eventRepo.save(eventRecord);                                                                                                                                          
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
    } 