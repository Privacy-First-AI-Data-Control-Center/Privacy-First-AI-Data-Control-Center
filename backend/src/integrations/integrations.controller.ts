import {                                                                                                                                                                               
      Body,                                                                                                                                                                                
      Controller,                                                                                                                                                                          
      Delete,                                                                                                                                                                              
      Get,                                                                                                                                                                                 
      HttpCode,                                                                                                                                                                            
      HttpStatus,                                                                                                                                                                          
      Param,                                                                                                                                                                               
      ParseIntPipe,                                                                                                                                                                        
      Patch,                                                                                                                                                                               
      Post,                                                                                                                                                                                
      Query,
      Req,
      UseGuards,                                                                                                                                                                               
    } from '@nestjs/common';                                                                                                                                                               
    import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';                                                                                                                  
    import { IntegrationsService } from './integrations.service.js';                                                                                                                       
    import { CreateIntegrationDto } from './dto/create-integration.dto.js';                                                                                                                
    import { UpdateIntegrationDto } from './dto/update-integration.dto.js';                                                                                                                
    import { QueryIntegrationDto } from './dto/query-integration.dto.js';                                                                                                                  
import { JwtGuard } from '../auth/jwtGuard.guard.js';
                                                                                                                                                                                           
    @ApiTags('Integrations (Shohag)')                                                                                                                                                      
    @Controller('workspaces/:workspaceId/integrations')   
    @UseGuards(JwtGuard)                                                                                                                                 
    export class IntegrationsController {                                                                                                                                                  
      constructor(private readonly integrationsService: IntegrationsService) {}                                                                                                            
                                                                                                                                                                                           
      @ApiOperation({ summary: 'Connect an AI tool or external service to a workspace' })                                                                                                  
      @ApiResponse({ status: 201, description: 'Integration connected' })                                                                                                                  
      @Post()                                                                                                                                                                              
      async create(                                                                                                                                                                        
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Body() dto: CreateIntegrationDto,  
        @Req() req: any  ,                                                                                                                                             
      ) {                                                                                                                                                                                  
        return this.integrationsService.create(workspaceId, dto,req.user.id);                                                                                                                          
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'List connected workspace integrations' })                                                                                                                  
      @Get()                                                                                                                                                                               
      async findAll(                                                                                                                                                                       
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Query() query: QueryIntegrationDto,                                                                                                                                               
      ) {                                                                                                                                                                                  
        return this.integrationsService.findAll(workspaceId, query);                                                                                                                       
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'View integration details' })                                                                                                                               
      @Get(':integrationId')                                                                                                                                                               
      async findOne(                                                                                                                                                                       
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Param('integrationId', ParseIntPipe) integrationId: number,                                                                                                                       
      ) {                                                                                                                                                                                  
        return this.integrationsService.findOne(workspaceId, integrationId);                                                                                                               
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'Update integration configuration' })                                                                                                                       
      @Patch(':integrationId')                                                                                                                                                             
      async update(                                                                                                                                                                        
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Param('integrationId', ParseIntPipe) integrationId: number,                                                                                                                       
        @Body() dto: UpdateIntegrationDto, 
        @Req() req: any                                                                                                                                                 
      ) {                                                                                                                                                                                  
        return this.integrationsService.update(workspaceId, integrationId, dto ,req.user.id);                                                                                                           
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'Test an integration connection and permissions' })                                                                                                         
      @Post(':integrationId/test')                                                                                                                                                         
      @HttpCode(HttpStatus.OK)                                                                                                                                                             
      async testConnection(                                                                                                                                                                
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Param('integrationId', ParseIntPipe) integrationId: number,                                                                                                                       
      ) {                                                                                                                                                                                  
        return this.integrationsService.testConnection(workspaceId, integrationId);                                                                                                        
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'Disconnect an integration' })                                                                                                                              
      @Post(':integrationId/disconnect')                                                                                                                                                   
      @HttpCode(HttpStatus.OK)                                                                                                                                                             
      async disconnect(                                                                                                                                                                    
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Param('integrationId', ParseIntPipe) integrationId: number,
         @Req() req: any                                                                                                                        
      ) {                                                                                                                                                                                  
        return this.integrationsService.disconnect(workspaceId, integrationId,req.user.id);                                                                                                            
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'Remove an integration record (soft delete)' })
      @Delete(':integrationId')
      async remove(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('integrationId', ParseIntPipe) integrationId: number,
         @Req() req: any 
      ) {
        return this.integrationsService.remove(workspaceId, integrationId,req.user.id);
      }
  
      @ApiOperation({ summary: 'View capabilities available for an integration' })
      @Get(':integrationId/capabilities')
      async getCapabilities(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('integrationId', ParseIntPipe) integrationId: number,
      ) {
        return this.integrationsService.getCapabilities(workspaceId, integrationId);
      }
  
      @ApiOperation({ summary: 'Refresh integration capability information' })
      @Post(':integrationId/capabilities/refresh')
      @HttpCode(HttpStatus.OK)
      async refreshCapabilities(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('integrationId', ParseIntPipe) integrationId: number,
         @Req() req: any 
      ) {
        return this.integrationsService.refreshCapabilities(workspaceId, integrationId ,req.user.id);
      }
    }
