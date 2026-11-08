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
    } from '@nestjs/common';                                                                                                                                                               
    import { EventsService } from './events.service.js';                                                                                                                                   
    import { AgentEventBatchDto } from './dto/agent-event-batch.dto.js';                                                                                                                   
    import { QueryEventsDto } from './dto/query-event.dto.js';                                                                                                                             
    import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
  
    @ApiTags('Events & Telemetry (Shohag)') 
                                                                                                                                                                                         
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
  
     
      @Get('workspaces/:workspaceId/events')
      async getWorkspaceEvents(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Query() query: QueryEventsDto,
      ) {
        return this.eventsService.findAll(workspaceId, query);
      }
  
      
      @Get('workspaces/:workspaceId/events/:eventId')
      async getEventDetail(@Param('eventId') eventId: string) {
        return this.eventsService.findOne(eventId);
      }
    }
