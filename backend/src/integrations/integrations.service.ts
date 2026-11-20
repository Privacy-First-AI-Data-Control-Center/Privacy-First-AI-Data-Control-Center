import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';                                                                                                                        
    import { InjectRepository } from '@nestjs/typeorm';                                                                                                                                    
    import { Repository } from 'typeorm';                                                                                                                                                  
    import { Integrations } from './entities/integration.entity.js';                                                                                                                       
    import { IntegrationCapabilities } from './entities/integration-capability.entity.js';                                                                                                 
    import { Workspaces } from '../workspace/entity/workspaces.js';                                                                                                                        
    import { ConnectorTypes } from '../connectors/entities/connector.entity.js';                                                                                                           
    import { ConnectorsService } from '../connectors/connectors.service.js';                                                                                                               
    import { CreateIntegrationDto } from './dto/create-integration.dto.js';                                                                                                                
    import { UpdateIntegrationDto } from './dto/update-integration.dto.js';                                                                                                                
    import { QueryIntegrationDto } from './dto/query-integration.dto.js';                                                                                                                  
    import { IntegrationStatus } from './enum/integration-status.js';                                                                                                                      
    import { AuditLogsService } from '../audit-logs/audit-logs.service.js';    
    import { DataSource } from 'typeorm';                                                                                                                                                                             
import { AuditLogs } from '../audit-logs/entities/audit-logs.entity.js';
import { ActorType } from '../audit-logs/enum/actor-type.js';
    @Injectable()                                                                                                                                                                          
    export class IntegrationsService {                                                                                                                                                     
      constructor(                                                                                                                                                                         
        @InjectRepository(Integrations)                                                                                                                                                    
        private readonly integrationRepo: Repository<Integrations>,                                                                                                                        
        @InjectRepository(IntegrationCapabilities)                                                                                                                                         
        private readonly capabilityRepo: Repository<IntegrationCapabilities>,                                                                                                              
        @InjectRepository(Workspaces)                                                                                                                                                      
        private readonly workspaceRepo: Repository<Workspaces>,                                                                                                                            
        @InjectRepository(ConnectorTypes)                                                                                                                                                  
        private readonly connectorTypeRepo: Repository<ConnectorTypes>,                                                                                                                    
        private readonly connectorsService: ConnectorsService,   
        private readonly auditLogsService :AuditLogsService ,  
        private readonly dataSource :DataSource ,                                                                                                                        
      ) {}                                                                                                                                                                                 
                                                                                                                                                                                           
      async create(workspaceId: number, dto: CreateIntegrationDto ,userId?: number): Promise<Integrations> {   
        
        const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
        if (!workspace) {
          throw new NotFoundException(`Workspace #${workspaceId} not found`);
        }
  
        const connectorType = await this.connectorTypeRepo.findOne({
          where: { id: dto.connectorTypeId },
        });
        if (!connectorType) {
          throw new NotFoundException(`Connector type #${dto.connectorTypeId} not found`);
        }

        if (dto.deviceId) {
          const duplicate = await this.integrationRepo.findOne({
            where: {
              workspace: { id: workspaceId },
              connectorType: { id: dto.connectorTypeId },
              deviceId: dto.deviceId,
              status: IntegrationStatus.ACTIVE,
            },
          });
          if (duplicate) {
            throw new ConflictException(
              `Active integration for connector "${connectorType.slug}" on device "${dto.deviceId}" already exists in workspace #${workspaceId}`,
            );
          }
        }
  
        const { capabilities: defaultCaps } = await this.connectorsService.getCapabilities(connectorType.id);
        const status = dto.status ?? IntegrationStatus.ACTIVE;
  
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
        
          const integration = queryRunner.manager.create(Integrations, {
            workspace,
            connectorType,
            deviceId: dto.deviceId,
            displayName: dto.displayName,
            version: dto.version ?? '1.0.0',
            status,
            secretReference: dto.secretReference,
            connectedAt: status === IntegrationStatus.ACTIVE ? new Date() : undefined,
          });
          const saved = await queryRunner.manager.save(Integrations, integration);
  
         
          const capEntities = defaultCaps.map((cap) =>
            queryRunner.manager.create(IntegrationCapabilities, {
              integration: saved,
              capabilityCode: cap.code,
              availability: 'observed',
              evidenceSource: 'connector_catalog',
              details: { name: cap.name, type: cap.type, description: cap.description },
            }),
          );
          if (capEntities.length > 0) {
            await queryRunner.manager.save(IntegrationCapabilities, capEntities); 
          }
  
          
          const auditLog = queryRunner.manager.create(AuditLogs, {
            workspace, 
            workspaceId,
            actorUserId: userId ?? null,
            actorType: userId ? ActorType.USER : ActorType.SYSTEM,
            action: 'INTEGRATION_CONNECTED',
            targetType: 'INTEGRATION',
            targetId: String(saved.id),
            metadata: { displayName: saved.displayName, connectorSlug: connectorType.slug }, 
          }); 
          await queryRunner.manager.save(AuditLogs, auditLog);
  
         
          await queryRunner.commitTransaction();
          return this.findOne(workspaceId, saved.id); 
        } catch (err) {
        
          await queryRunner.rollbackTransaction();
          throw err;
        } finally {
         
          await queryRunner.release(); 
        }


                                                                                                                                               
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      async findAll(workspaceId: number, query: QueryIntegrationDto) {                                                                                                                     
        const page = query.page ?? 1;                                                                                                                                                      
        const limit = query.limit ?? 20;                                                                                                                                                   
                                                                                                                                                                                           
        const [items, total] = await this.integrationRepo.findAndCount({                                                                                                                   
          where: {                                                                                                                                                                         
            workspace: { id: workspaceId },                                                                                                                                                
            ...(query.status ? { status: query.status } : {}),                                                                                                                             
          },                                                                                                                                                                               
          relations: {'connectorType':true},                                                                                                                                                    
          order: { createdAt: 'DESC' },                                                                                                                                                    
          skip: (page - 1) * limit,                                                                                                                                                        
          take: limit,                                                                                                                                                                     
        });                                                                                                                                                                                
                                                                                                                                                                                           
        return {                                                                                                                                                                           
          items,                                                                                                                                                                           
          meta: {                                                                                                                                                                          
            total,                                                                                                                                                                         
            page,                                                                                                                                                                          
            limit,                                                                                                                                                                         
            totalPages: Math.ceil(total / limit),                                                                                                                                          
          },                                                                                                                                                                               
        };                                                                                                                                                                                 
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      async findOne(workspaceId: number, integrationId: number): Promise<Integrations> {                                                                                                   
        const integration = await this.integrationRepo.findOne({                                                                                                                           
          where: {                                                                                                                                                                         
            id: integrationId,                                                                                                                                                             
            workspace: { id: workspaceId },                                                                                                                                                
          },                                                                                                                                                                               
          relations: {'connectorType':true , 'capabilities':true},                                                                                                                                    
        });                                                                                                                                                                                
                                                                                                                                                                                           
        if (!integration) {                                                                                                                                                                
          throw new NotFoundException(                                                                                                                                                     
            `Integration #${integrationId} not found in workspace #${workspaceId}`,                                                                                                        
          );                                                                                                                                                                               
        }                                                                                                                                                                                  
                                                                                                                                                                                           
        return integration;                                                                                                                                                                
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      async update(                                                                                                                                                                        
        workspaceId: number,                                                                                                                                                               
        integrationId: number,                                                                                                                                                             
        dto: UpdateIntegrationDto,   
        userId?:number ,                                                                                                                                                      
      ): Promise<Integrations> {                                                                                                                                                           
        const integration = await this.findOne(workspaceId, integrationId);                                                                                                                
                                                                                                                                                                                           
        if (dto.connectorTypeId !== undefined) {                                                                                                                                           
          const connectorType = await this.connectorTypeRepo.findOne({                                                                                                                     
            where: { id: dto.connectorTypeId },                                                                                                                                            
          });                                                                                                                                                                              
          if (!connectorType) {                                                                                                                                                            
            throw new NotFoundException(`Connector type #${dto.connectorTypeId} not found`);                                                                                               
          }                                                                                                                                                                                
          integration.connectorType = connectorType;                                                                                                                                       
        }                                                                                                                                                                                  
                                                                                                                                                                                           
        if (dto.deviceId !== undefined) integration.deviceId = dto.deviceId;                                                                                                               
        if (dto.displayName !== undefined) integration.displayName = dto.displayName;                                                                                                      
        if (dto.version !== undefined) integration.version = dto.version;                                                                                                                  
        if (dto.secretReference !== undefined) integration.secretReference = dto.secretReference;                                                                                          
                                                                                                                                                                                           
        if (dto.status !== undefined) {                                                                                                                                                    
          integration.status = dto.status;                                                                                                                                                 
          if (dto.status === IntegrationStatus.ACTIVE) {                                                                                                                                   
            integration.connectedAt = new Date();                                                                                                                                          
            integration.disconnectedAt = undefined;                                                                                                                                        
          } else if (dto.status === IntegrationStatus.DISCONNECTED) {                                                                                                                      
            integration.disconnectedAt = new Date();                                                                                                                                       
          }                                                                                                                                                                                
        }                                                                                                                                                                                  
                                                                                                                                                                                           
        await this.integrationRepo.save(integration);  
         await this.auditLogsService.log({
          workspaceId,
          actorUserId: userId,
          action: 'INTEGRATION_UPDATED',
          targetType: 'INTEGRATION',
          targetId: integrationId,
          metadata: { updatedFields: Object.keys(dto) },
        });                                                                                                                                    
        return this.findOne(workspaceId, integrationId);                                                                                                                                   
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      async testConnection(workspaceId: number, integrationId: number) {                                                                                                                   
        const integration = await this.findOne(workspaceId, integrationId);                                                                                                                
        const healthy = integration.status === IntegrationStatus.ACTIVE;                                                                                                                   
                                                                                                                                                                                           
        return {                                                                                                                                                                           
          integrationId: integration.id,                                                                                                                                                   
          connectorSlug: integration.connectorType.slug,                                                                                                                                   
          status: integration.status,                                                                                                                                                      
          reachable: healthy,                                                                                                                                                              
          capabilitiesCount: integration.capabilities?.length ?? 0,                                                                                                                        
          checkedAt: new Date(),                                                                                                                                                           
        };                                                                                                                                                                                 
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      async disconnect(workspaceId: number, integrationId: number ,userId?:number): Promise<Integrations> {                                                                                                
        const integration = await this.findOne(workspaceId, integrationId);                                                                                                                
        integration.status = IntegrationStatus.DISCONNECTED;                                                                                                                               
        integration.disconnectedAt = new Date();                                                                                                                                           
        await this.integrationRepo.save(integration);
        await this.auditLogsService.log({
          workspaceId, 
          actorUserId: userId,
          action: 'INTEGRATION_DISCONNECTED',
          targetType: 'INTEGRATION', 
          targetId: integrationId,
        });                                                                                                                                      
        return this.findOne(workspaceId, integrationId);  

      }                                                                                                                                                                                    
                                                                                                                                                                                           
      async remove(workspaceId: number, integrationId: number,userId?:number) {                                                                                                                           
        const integration = await this.findOne(workspaceId, integrationId);                                                                                                                
        await this.integrationRepo.softDelete(integration.id); 
         await this.auditLogsService.log({ 
          workspaceId,
          actorUserId: userId, 
          action: 'INTEGRATION_DELETED',
          targetType: 'INTEGRATION', 
          targetId: integration.id,
        });                                                                                                                             
        return { deleted: true, integrationId: integration.id };                                                                                                                           
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      async getCapabilities(                                                                                                                                                               
        workspaceId: number,                                                                                                                                                               
        integrationId: number,                                                                                                                                                             
      ): Promise<IntegrationCapabilities[]> {                                                                                                                                              
        await this.findOne(workspaceId, integrationId);                                                                                                                                    
        return this.capabilityRepo.find({                                                                                                                                                  
          where: { integration: { id: integrationId } },                                                                                                                                   
          order: { id: 'ASC' },                                                                                                                                                            
        });                                                                                                                                                                                
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      async refreshCapabilities(                                                                                                                                                           
        workspaceId: number,                                                                                                                                                               
        integrationId: number, 
        userId?: number,                                                                                                                                                            
      ): Promise<IntegrationCapabilities[]> {                                                                                                                                              
        const integration = await this.findOne(workspaceId, integrationId);                                                                                                                
        const catalog = await this.connectorsService.getCapabilities(integration.connectorType.id);                                                                                        
                                                                                                                                                                                           
        for (const def of catalog.capabilities) {                                                                                                                                          
          const existing = await this.capabilityRepo.findOne({                                                                                                                             
            where: {                                                                                                                                                                       
              integration: { id: integration.id },                                                                                                                                         
              capabilityCode: def.code,                                                                                                                                                    
            },                                                                                                                                                                             
          });                                                                                                                                                                              
                                                                                                                                                                                           
          const details: Record<string, unknown> = {                                                                                                                                       
            name: def.name,                                                                                                                                                                
            type: def.type,                                                                                                                                                                
            description: def.description,                                                                                                                                                  
          };                                                                                                                                                                               
                                                                                                                                                                                           
          if (existing) {                                                                                                                                                                  
            existing.availability = 'observed';                                                                                                                                            
            existing.evidenceSource = 'connector_catalog';                                                                                                                                 
            existing.observedAt = new Date();                                                                                                                                              
            existing.details = details;                                                                                                                                                    
            await this.capabilityRepo.save(existing);                                                                                                                                      
          } else {                                                                                                                                                                         
            await this.capabilityRepo.save(                                                                                                                                                
              this.capabilityRepo.create({                                                                                                                                                 
                integration,                                                                                                                                                               
                capabilityCode: def.code,                                                                                                                                                  
                availability: 'observed',                                                                                                                                                  
                evidenceSource: 'connector_catalog',                                                                                                                                       
                details,                                                                                                                                                                   
              }),                                                                                                                                                                          
            );                                                                                                                                                                             
          }                                                                                                                                                                                
        }     
         await this.auditLogsService.log({                                                                                                                                                  
          workspaceId,                                                                                                                                                                     
          actorUserId: userId,                                                                                                                                                             
          action: 'INTEGRATION_CAPABILITIES_REFRESHED',                                                                                                                                    
          targetType: 'INTEGRATION',                                                                                                                                                       
          targetId: integration.id,                                                                                                                                                        
          metadata: { capabilitiesCount: catalog.capabilities.length },                                                                                                                    
        });                                                                                                                                                                              
                                                                                                                                                                                           
        return this.getCapabilities(workspaceId, integrationId);                                                                                                                           
      }                                                                                                                                                                                    
    } 