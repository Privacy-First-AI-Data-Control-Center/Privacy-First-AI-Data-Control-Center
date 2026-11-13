 import { Module } from '@nestjs/common';                                                                                                                                               
    import { TypeOrmModule } from '@nestjs/typeorm';                                                                                                                                       
    import { AgentService } from './agent.service.js';                                                                                                                                     
    import { AgentController } from './agent.controller.js';                                                                                                                               
    import { AgentInstallations } from './entity/agent-installations.js';                                                                                                                  
    import { Integrations } from '../integrations/entities/integration.entity.js';                                                                                                         
    import { Policies } from '../policy/entities/policy.entity.js';                                                                                                                        
    import { PolicyVersions } from '../policy/entities/policy-version.entity.js';                                                                                                          
    import { ConnectorsModule } from '../connectors/connectors.module.js';                                                                                                                 
                                                                                                                                                                                           
    @Module({                                                                                                                                                                              
      imports: [                                                                                                                                                                           
        TypeOrmModule.forFeature([                                                                                                                                                         
          AgentInstallations,                                                                                                                                                              
          Integrations,                                                                                                                                                                    
          Policies,                                                                                                                                                                        
          PolicyVersions,                                                                                                                                                                  
        ]),                                                                                                                                                                                
        ConnectorsModule,                                                                                                                                                                  
      ],                                                                                                                                                                                   
      controllers: [AgentController],                                                                                                                                                      
      providers: [AgentService],                                                                                                                                                           
    })                                                                                                                                                                                     
    export class AgentModule {} 