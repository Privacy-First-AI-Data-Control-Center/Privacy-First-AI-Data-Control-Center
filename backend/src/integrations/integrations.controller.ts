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
      UseGuards,
    } from '@nestjs/common';
    import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
    import { IntegrationsService } from './integrations.service.js';
    import { CreateIntegrationDto } from './dto/create-integration.dto.js';
    import { UpdateIntegrationDto } from './dto/update-integration.dto.js';
    import { QueryIntegrationDto } from './dto/query-integration.dto.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

    @ApiTags('Integrations')
    @Controller('workspaces/:workspaceId/integrations')
    @UseGuards(JwtGuard, RolesGuard)
    export class IntegrationsController {
      constructor(private readonly integrationsService: IntegrationsService) {}

      @ApiOperation({ summary: 'Connect an AI tool or external service to a workspace' })
      @ApiResponse({ status: 201, description: 'Integration connected' })
      @Roles(Role.OWNER, Role.ADMIN)
      @Post()
      async create(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Body() dto: CreateIntegrationDto,
        @CurrentUser('id') userId: number,
      ) {
        return this.integrationsService.create(workspaceId, dto, userId);
      }

      @ApiOperation({ summary: 'List connected workspace integrations' })
      @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
      @Get()
      async findAll(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Query() query: QueryIntegrationDto,
      ) {
        return this.integrationsService.findAll(workspaceId, query);
      }

      @ApiOperation({ summary: 'View integration details' })
      @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
      @Get(':integrationId')
      async findOne(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('integrationId', ParseIntPipe) integrationId: number,
      ) {
        return this.integrationsService.findOne(workspaceId, integrationId);
      }

      @ApiOperation({ summary: 'Update integration configuration' })
      @Roles(Role.OWNER, Role.ADMIN)
      @Patch(':integrationId')
      async update(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('integrationId', ParseIntPipe) integrationId: number,
        @Body() dto: UpdateIntegrationDto,
        @CurrentUser('id') userId: number,
      ) {
        return this.integrationsService.update(workspaceId, integrationId, dto, userId);
      }

      @ApiOperation({ summary: 'Test an integration connection and permissions' })
      @Roles(Role.OWNER, Role.ADMIN)
      @Post(':integrationId/test')
      @HttpCode(HttpStatus.OK)
      async testConnection(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('integrationId', ParseIntPipe) integrationId: number,
      ) {
        return this.integrationsService.testConnection(workspaceId, integrationId);
      }

      @ApiOperation({ summary: 'Disconnect an integration' })
      @Roles(Role.OWNER, Role.ADMIN)
      @Post(':integrationId/disconnect')
      @HttpCode(HttpStatus.OK)
      async disconnect(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('integrationId', ParseIntPipe) integrationId: number,
        @CurrentUser('id') userId: number,
      ) {
        return this.integrationsService.disconnect(workspaceId, integrationId, userId);
      }

      @ApiOperation({ summary: 'Remove an integration record (soft delete)' })
      @Roles(Role.OWNER, Role.ADMIN)
      @Delete(':integrationId')
      async remove(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('integrationId', ParseIntPipe) integrationId: number,
        @CurrentUser('id') userId: number,
      ) {
        return this.integrationsService.remove(workspaceId, integrationId, userId);
      }

      @ApiOperation({ summary: 'View capabilities available for an integration' })
      @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
      @Get(':integrationId/capabilities')
      async getCapabilities(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('integrationId', ParseIntPipe) integrationId: number,
      ) {
        return this.integrationsService.getCapabilities(workspaceId, integrationId);
      }

      @ApiOperation({ summary: 'Refresh integration capability information' })
      @Roles(Role.OWNER, Role.ADMIN)
      @Post(':integrationId/capabilities/refresh')
      @HttpCode(HttpStatus.OK)
      async refreshCapabilities(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('integrationId', ParseIntPipe) integrationId: number,
        @CurrentUser('id') userId: number,
      ) {
        return this.integrationsService.refreshCapabilities(workspaceId, integrationId, userId);
      }
    }
