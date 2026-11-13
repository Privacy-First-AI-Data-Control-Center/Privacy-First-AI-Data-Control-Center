import { Injectable, NotFoundException } from '@nestjs/common';                                                                                                                        
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
      ) {}                                                                                                                                                                                 
                                                                                                                                                                                           
      async create(workspaceId: number, dto: CreateIntegrationDto): Promise<Integrations> {                                                                                                
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
                                                                                                                                                                                           
        const status = dto.status ?? IntegrationStatus.ACTIVE;                                                                                                                             
        const integration = this.integrationRepo.create({                                                                                                                                  
          workspace,                                                                                                                                                                       
          connectorType,                                                                                                                                                                   
          deviceId: dto.deviceId,                                                                                                                                                          
          displayName: dto.displayName,                                                                                                                                                    
          version: dto.version ?? '1.0.0',                                                                                                                                                 
          status,                                                                                                                                                                          
          secretReference: dto.secretReference,                                                                                                                                            
          connectedAt: status === IntegrationStatus.ACTIVE ? new Date() : undefined,                                                                                                       
        });                                                                                                                                                                                
                                                                                                                                                                                           
        const saved = await this.integrationRepo.save(integration);                                                                                                                        
        await this.refreshCapabilities(workspaceId, saved.id);                                                                                                                             
        return this.findOne(workspaceId, saved.id);                                                                                                                                        
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
                                                                                                                                                                                           
      async disconnect(workspaceId: number, integrationId: number): Promise<Integrations> {                                                                                                
        const integration = await this.findOne(workspaceId, integrationId);                                                                                                                
        integration.status = IntegrationStatus.DISCONNECTED;                                                                                                                               
        integration.disconnectedAt = new Date();                                                                                                                                           
        await this.integrationRepo.save(integration);                                                                                                                                      
        return this.findOne(workspaceId, integrationId);                                                                                                                                   
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      async remove(workspaceId: number, integrationId: number) {                                                                                                                           
        const integration = await this.findOne(workspaceId, integrationId);                                                                                                                
        await this.integrationRepo.softDelete(integration.id);                                                                                                                             
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
                                                                                                                                                                                           
        return this.getCapabilities(workspaceId, integrationId);                                                                                                                           
      }                                                                                                                                                                                    
    } 