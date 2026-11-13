import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
    import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
    import { AgentService } from './agent.service.js';
  
    @ApiTags('Agent Sync (Shohag)')
    @Controller('agent')
    export class AgentController {
      constructor(private readonly agentService: AgentService) {}
  
      @ApiOperation({ summary: 'Retrieve connector configuration for the agent' })
      @ApiQuery({ name: 'workspaceId', required: false, type: Number })
      @ApiQuery({ name: 'deviceId', required: false, type: String })
      @Get('connectors')
      async getConnectorsConfig(
        @Query('workspaceId', new ParseIntPipe({ optional: true })) workspaceId?: number,
        @Query('deviceId') deviceId?: string,
      ) {
        return this.agentService.getAgentConnectorsConfig(workspaceId, deviceId);
      }
  
      @ApiOperation({ summary: 'Retrieve active policies applicable to the agent' })
      @ApiQuery({ name: 'workspaceId', required: false, type: Number })
      @Get('policies/active')
      async getActivePolicies(
        @Query('workspaceId', new ParseIntPipe({ optional: true })) workspaceId?: number,
      ) {
        return this.agentService.getActivePolicies(workspaceId);
      }
    }
