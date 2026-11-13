import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AgentInstallations } from './entity/agent-installations.js';
import { Repository } from 'typeorm';
import { CreateAgentInstallationDto } from './dto/create-agent-installation.dto.js';
import { Integrations } from '../integrations/entities/integration.entity.js';
import { Policies } from '../policy/entities/policy.entity.js';
import { PolicyVersions } from '../policy/entities/policy-version.entity.js';
import { ConnectorsService } from '../connectors/connectors.service.js';
import { IntegrationStatus } from '../integrations/enum/integration-status.js';
import { PolicyStatus } from '../policy/enums/policy-status.enum.js';

@Injectable()
export class AgentService {
    constructor(@InjectRepository(AgentInstallations) private agentInstallationRepo: Repository<AgentInstallations>,
       @InjectRepository(Integrations)                                                                                                                                                    
        private readonly integrationRepo: Repository<Integrations>,                                                                                                                        
        @InjectRepository(Policies)                                                                                                                                                        
        private readonly policyRepo: Repository<Policies>,                                                                                                                                 
        @InjectRepository(PolicyVersions)                                                                                                                                                  
        private readonly policyVersionRepo: Repository<PolicyVersions>,                                                                                                                    
        private readonly connectorsService: ConnectorsService,){}

    async getAgentList(deviceId: string): Promise<AgentInstallations[]>{
        return this.agentInstallationRepo.find({
            where:{
                device:{
                    id: parseInt(deviceId)
                }
            }
        })
    }

    async enrollAgent(createAgentInstallationDto: CreateAgentInstallationDto): Promise<any>{
        try{
            const agentInfo = await this.agentInstallationRepo.create({
                ...createAgentInstallationDto,
                device: {id: createAgentInstallationDto.deviceId}
            });

            const agent = await this.agentInstallationRepo.save(agentInfo);
            
            if(agent != null){
                return 'Agent enrolled successfully';
            }
            else{
                return 'Failed to enroll agent';
            }
        }
        catch{
            throw new BadRequestException("Failed to add member");
        }     
    }

     async getAgentConnectorsConfig(workspaceId?: number, deviceId?: string) {                                                                                                            
        const connectorTypes = await this.connectorsService.findAll();                                                                                                                     
        
        const supportedConnectors = await Promise.all(                                                                                                                                     
          connectorTypes.map(async (connector) => {                                                                                                                                        
            const { capabilities } = await this.connectorsService.getCapabilities(connector.id);                                                                                           
            return {                                                                                                                                                                       
              id: connector.id,                                                                                                                                                            
              slug: connector.slug,                                                                                                                                                        
              displayName: connector.displayName,
              vendor: connector.vendor,
              documentationUrl: connector.documentationUrl,
              capabilities,
            };
          }),
        );

            
                                                                                                                                                                               
                                                                                                                                                                                           
        const activeIntegrations = await this.integrationRepo.find({                                                                                                                       
          where: {                                                                                                                                                                         
            status: IntegrationStatus.ACTIVE,                                                                                                                                              
            ...(workspaceId !== undefined ? { workspace: { id: workspaceId } } : {}),                                                                                                      
            ...(deviceId !== undefined ? { deviceId } : {}),                                                                                                                               
          },                                                                                                                                                                               
          relations: {                                                                                                                                                                     
            connectorType: true,                                                                                                                                                           
            capabilities: true,                                                                                                                                                            
          },                                                                                                                                                                               
          order: { id: 'ASC' },                                                                                                                                                            
        });                                                                                                                                                                                
                                                                                                                                                                                           
        return {                                                                                                                                                                           
          syncedAt: new Date().toISOString(),                                                                                                                                              
          supportedConnectors,                                                                                                                                                             
          configuredIntegrations: activeIntegrations,                                                                                                                                      
        };                                                                                                                                                                                 
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      async getActivePolicies(workspaceId?: number) {                                                                                                                                      
        const activePolicies = await this.policyRepo.find({                                                                                                                                
          where: {                                                                                                                                                                         
            status: PolicyStatus.ACTIVE,                                                                                                                                                   
            ...(workspaceId !== undefined ? { workspace: { id: workspaceId } } : {}),                                                                                                      
          },                                                                                                                                                                               
          relations: {                                                                                                                                                                     
            workspace: true,                                                                                                                                                               
          },                                                                                                                                                                               
          order: {                                                                                                                                                                         
            priority: 'DESC',                                                                                                                                                              
            createdAt: 'DESC',                                                                                                                                                             
          },                                                                                                                                                                               
        });                                                                                                                                                                                
                                                                                                                                                                                           
        const policiesWithRules = await Promise.all(                                                                                                                                       
          activePolicies.map(async (policy) => {                                                                                                                                           
            const latestVersion = await this.policyVersionRepo.findOne({                                                                                                                   
              where: { policy: { id: policy.id } },                                                                                                                                        
              relations: { policy_rules: true },                                                                                                                                           
              order: {                                                                                                                                                                     
                versionNumber: 'DESC',                                                                                                                                                     
                policy_rules: { position: 'ASC' },                                                                                                                                         
              },                                                                                                                                                                           
            });                                                                                                                                                                            
                                                                                                                                                                                           
            return {                                                                                                                                                                       
              id: policy.id,                                                                                                                                                               
              workspaceId: policy.workspace?.id,                                                                                                                                           
              name: policy.name,                                                                                                                                                           
              description: policy.description,                                                                                                                                             
              priority: policy.priority,                                                                                                                                                   
              status: policy.status,                                                                                                                                                       
              versionNumber: latestVersion?.versionNumber ?? null,                                                                                                                         
              definitionSnapshot: latestVersion?.definitionSnapshot ?? null,                                                                                                               
              rules: (latestVersion?.policy_rules ?? []).filter((rule) => rule.enabled),                                                                                                   
              updatedAt: policy.updatedAt,                                                                                                                                                 
            };                                                                                                                                                                             
          }),                                                                                                                                                                              
        );                                                                                                                                                                                 
                                                                                                                                                                                           
        return {                                                                                                                                                                           
          syncedAt: new Date().toISOString(),                                                                                                                                              
          total: policiesWithRules.length,                                                                                                                                                 
          policies: policiesWithRules,                                                                                                                                                     
        };                                                                                                                                                                                 
      }                                                                                                                                                                                    
    }  

