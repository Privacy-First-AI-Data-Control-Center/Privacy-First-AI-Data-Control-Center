import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AgentService } from './agent.service.js';
import { CompleteEnrollmentDto } from './dto/complete-enrollment.dto.js';
import { AgentHeartbeatDto } from './dto/agent-heartbeat.dto.js';
import { AgentDiagnosticsDto } from './dto/agent-diagnostics.dto.js';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @ApiOperation({ summary: 'Complete device-agent enrollment' })
  @ApiResponse({ status: 201, description: 'Device agent enrollment completed successfully' })
  @Post('enrollments/complete')
  async completeEnrollment(@Body() dto: CompleteEnrollmentDto) {
    return this.agentService.completeEnrollment(dto);
  }

  @ApiOperation({ summary: 'Send agent health and presence information' })
  @ApiResponse({ status: 200, description: 'Heartbeat acknowledged' })
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Body() dto: AgentHeartbeatDto) {
    return this.agentService.recordHeartbeat(dto);
  }

  @ApiOperation({ summary: 'Retrieve configuration for the authenticated agent' })
  @ApiQuery({ name: 'deviceId', required: false, type: Number })
  @ApiQuery({ name: 'installationId', required: false, type: String })
  @Get('config')
  async getAgentConfig(
    @Query('deviceId', new ParseIntPipe({ optional: true })) deviceId?: number,
    @Query('installationId') installationId?: string,
  ) {
    return this.agentService.getAgentConfig(deviceId, installationId);
  }

  @ApiOperation({ summary: 'Submit agent diagnostic information' })
  @ApiResponse({ status: 200, description: 'Diagnostics recorded successfully' })
  @Post('diagnostics')
  @HttpCode(HttpStatus.OK)
  async recordDiagnostics(@Body() dto: AgentDiagnosticsDto) {
    return this.agentService.recordDiagnostics(dto);
  }

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
