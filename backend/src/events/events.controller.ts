import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service.js';
import { AgentEventBatchDto } from './dto/agent-event-batch.dto.js';
import { QueryEventsDto } from './dto/query-event.dto.js';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';

@ApiTags('Events & Telemetry')
@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiOperation({ summary: 'Ingest batch of telemetry events from local agent' })
  @ApiResponse({ status: 200, description: 'Batch ingested successfully' })
  @Post('agent/events/batch')
  @HttpCode(HttpStatus.OK)
  async ingestBatch(@Body() batchDto: AgentEventBatchDto) {
    return this.eventsService.processBatch(batchDto);
  }

  @ApiOperation({ summary: 'List workspace events with filtering and pagination' })
  @Get('workspaces/:workspaceId/events')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getWorkspaceEvents(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Query() query: QueryEventsDto,
  ) {
    return this.eventsService.findAll(workspaceId, query);
  }

  @ApiOperation({ summary: 'Get event statistics and category trends' })
  @Get('workspaces/:workspaceId/events/statistics')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getStatistics(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.eventsService.getStatistics(workspaceId, from, to);
  }

  @ApiOperation({ summary: 'Get details of a single event' })
  @Get('workspaces/:workspaceId/events/:eventId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getEventDetail(@Param('eventId') eventId: string) {
    return this.eventsService.findOne(eventId);
  }

  @ApiOperation({ summary: 'Get structured attributes for an event' })
  @Get('workspaces/:workspaceId/events/:eventId/attributes')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getEventAttributes(@Param('eventId') eventId: string) {
    return this.eventsService.getEventAttributes(eventId);
  }

  @ApiOperation({ summary: 'Get ingestion timeline and latency for an event' })
  @Get('workspaces/:workspaceId/events/:eventId/timeline')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getEventTimeline(@Param('eventId') eventId: string) {
    return this.eventsService.getEventTimeline(eventId);
  }

  @ApiOperation({ summary: 'List all normalized event types' })
  @Get('workspaces/:workspaceId/event-types')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async getEventTypes() {
    return this.eventsService.getEventTypes();
  }
}
