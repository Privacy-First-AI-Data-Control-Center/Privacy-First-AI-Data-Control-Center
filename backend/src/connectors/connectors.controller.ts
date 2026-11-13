    import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';                                                                                                                 
    import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';                                                                                                                  
    import { ConnectorsService } from './connectors.service.js';                                                                                                                           
                                                                                                                                                                                           
    @ApiTags('Connectors (Shohag)')                                                                                                                                                        
    @Controller('connectors')                                                                                                                                                              
    export class ConnectorsController {                                                                                                                                                    
      constructor(private readonly connectorsService: ConnectorsService) {}                                                                                                                
                                                                                                                                                                                           
      @ApiOperation({ summary: 'List supported AI-tool connector types' })                                                                                                                 
      @ApiResponse({ status: 200, description: 'List of seeded connector types' })                                                                                                         
      @Get()                                                                                                                                                                               
      async findAll() {                                                                                                                                                                    
        return this.connectorsService.findAll();                                                                                                                                           
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'View information about one connector' })                                                                                                                   
      @ApiResponse({ status: 200, description: 'Connector details' })                                                                                                                      
      @ApiResponse({ status: 404, description: 'Connector not found' })                                                                                                                    
      @Get(':connectorId')                                                                                                                                                                 
      async findOne(@Param('connectorId', ParseIntPipe) connectorId: number) {                                                                                                             
        return this.connectorsService.findOne(connectorId);                                                                                                                                
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'View monitoring and control capabilities of a connector' })                                                                                                
      @ApiResponse({ status: 200, description: 'Connector capability definitions' })                                                                                                       
      @ApiResponse({ status: 404, description: 'Connector not found' })                                                                                                                    
      @Get(':connectorId/capabilities')                                                                                                                                                    
      async getCapabilities(@Param('connectorId', ParseIntPipe) connectorId: number) {                                                                                                     
        return this.connectorsService.getCapabilities(connectorId);                                                                                                                        
      }                                                                                                                                                                                    
    }