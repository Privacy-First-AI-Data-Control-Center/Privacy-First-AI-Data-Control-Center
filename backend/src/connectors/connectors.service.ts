import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateConnectorDto } from './dto/create-connector-type.dto.js';
import { UpdateConnectorDto } from './dto/update-connector-type.dto.js';
import { ConnectorTypes } from './entities/connector.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises } from 'dns';
export interface ConnectorCapabilityDefinition{
  code : string

  name : string
  type : 'monitoring' | 'control'
  description : string
}

const DEFAULT_CONNECTORS: Array<                                                                                                                                                       
      Pick<ConnectorTypes, 'slug' | 'displayName' | 'vendor' | 'documentationUrl'>                                                                                                         
    > = [                                                                                                                                                                                  
      {                                                                                                                                                                                    
        slug: 'claude-code',                                                                                                                                                               
        displayName: 'Claude Code',                                                                                                                                                        
        vendor: 'Anthropic',                                                                                                                                                               
        documentationUrl: 'https://docs.anthropic.com/en/docs/claude-code/hooks',                                                                                                          
      },                                                                                                                                                                                   
      {                                                                                                                                                                                    
        slug: 'antigravity',                                                                                                                                                               
        displayName: 'Antigravity',                                                                                                                                                        
        vendor: 'Google DeepMind',                                                                                                                                                         
        documentationUrl: 'https://antigravity.google/docs',                                                                                                                               
      },                                                                                                                                                                                   
      {                                                                                                                                                                                    
        slug: 'cursor',                                                                                                                                                                    
        displayName: 'Cursor',                                                                                                                                                             
        vendor: 'Anysphere',                                                                                                                                                               
        documentationUrl: 'https://docs.cursor.com',                                                                                                                                       
      },                                                                                                                                                                                   
    ];  
    
     const CONNECTOR_CAPABILITIES_CATALOG: Record<string, ConnectorCapabilityDefinition[]> = {                                                                                              
      'claude-code': [                                                                                                                                                                     
        {                                                                                                                                                                                  
          code: 'hook.pre_tool_use',                                                                                                                                                       
          name: 'Pre-Tool Execution Hook',                                                                                                                                                 
          type: 'control',                                                                                                                                                                 
          description: 'Intercepts Bash, file read/write, and MCP calls before execution.',                                                                                                
        },                                                                                                                                                                                 
        {                                                                                                                                                                                  
          code: 'hook.post_tool_use',                                                                                                                                                      
          name: 'Post-Tool Telemetry Hook',                                                                                                                                                
          type: 'monitoring',                                                                                                                                                              
          description: 'Captures tool inputs, targets, and execution outcomes after completion.',                                                                                          
        },                                                                                                                                                                                 
        {                                                                                                                                                                                  
          code: 'hook.user_prompt_submit',                                                                                                                                                 
          name: 'Prompt Submission Telemetry',                                                                                                                                             
          type: 'monitoring',                                                                                                                                                              
          description: 'Monitors user prompts for sensitive data before dispatch.',                                                                                                        
        },                                                                                                                                                                                 
      ],                                                                                                                                                                                   
      antigravity: [                                                                                                                                                                       
        {                                                                                                                                                                                  
          code: 'hook.mcp_audit',                                                                                                                                                          
          name: 'MCP Tool Call Audit',                                                                                                                                                     
          type: 'monitoring',                                                                                                                                                              
          description: 'Logs agent tool invocations and workspace file reads/writes.',                                                                                                     
        },                                                                                                                                                                                 
        {                                                                                                                                                                                  
          code: 'policy.enforcement',                                                                                                                                                      
          name: 'Local Policy Enforcement',                                                                                                                                                
          type: 'control',                                                                                                                                                                 
          description: 'Applies workspace allow/warn/block policy decisions.',                                                                                                             
        },                                                                                                                                                                                 
      ],                                                                                                                                                                                   
      cursor: [                                                                                                                                                                            
        {                                                                                                                                                                                  
          code: 'telemetry.workspace_scan',                                                                                                                                                
          name: 'Workspace Context Telemetry',                                                                                                                                             
          type: 'monitoring',                                                                                                                                                              
          description: 'Detects context files and commands shared with AI assistants.',                                                                                                    
        },                                                                                                                                                                                 
      ],                                                                                                                                                                                   
    }; 

@Injectable()
export class ConnectorsService implements OnModuleInit {
  
  constructor( 
    @InjectRepository(ConnectorTypes)
    private readonly connectorRepo : Repository<ConnectorTypes>


  ){}
   async onModuleInit(): Promise<void> {                                                                                                                                                
        await this.seedDefaultConnectors();                                                                                                                                                
      }  

  private async seedDefaultConnectors ():Promise<void> {
    for (const item of DEFAULT_CONNECTORS)
    {
      const existing = await this.connectorRepo.findOne({
        where :{slug: item.slug } ,
      })
      if(!existing){
       await this.connectorRepo.save(this.connectorRepo.create(item))
      }
    }



  }

  async findAll():Promise<ConnectorTypes[]>{

   return await this.connectorRepo.find({
      order : {id:'ASC'}
    })
  }
  create(createConnectorDto: CreateConnectorDto) {
    return 'This action adds a new connector';
  }

  async findOne(connectorId: number): Promise<ConnectorTypes> {                                                                                                                        
        const connector = await this.connectorRepo.findOne({                                                                                                                               
          where: { id: connectorId },                                                                                                                                                      
        });                                                                                                                                                                                
                                                                                                                                                                                           
        if (!connector) {                                                                                                                                                                  
          throw new NotFoundException(`Connector #${connectorId} not found`);                                                                                                              
        }                                                                                                                                                                                  
                                                                                                                                                                                           
        return connector;                                                                                                                                                                  
      }   


async getCapabilities(connectorId: number): Promise<{                                                                                                                                
        connectorId: number;                                                                                                                                                               
        slug: string;                                                                                                                                                                      
        displayName: string;                                                                                                                                                               
        capabilities: ConnectorCapabilityDefinition[];                                                                                                                                     
      }> {                                                                                                                                                                                 
        const connector = await this.findOne(connectorId);                                                                                                                                 
        return {                                                                                                                                                                           
          connectorId: connector.id,                                                                                                                                                       
          slug: connector.slug,                                                                                                                                                            
          displayName: connector.displayName,                                                                                                                                              
          capabilities: CONNECTOR_CAPABILITIES_CATALOG[connector.slug] ?? [],                                                                                                              
        };                                                                                                                                                                                 
      }                                                                                                                                                                                    
    } 

