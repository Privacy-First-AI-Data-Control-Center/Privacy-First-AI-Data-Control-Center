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
      Req,                                                                                                                                                                                 
      StreamableFile,                                                                                                                                                                      
      UseGuards,                                                                                                                                                                           
    } from '@nestjs/common';                                                                                                                                                               
    import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';                                                                                                                  
    import { ReportsService } from './reports.service.js';                                                                                                                                 
    import { CreateReportDto } from './dto/create-report.dto.js';                                                                                                                          
    import { UpdateReportDto } from './dto/update-report.dto.js';                                                                                                                          
    import { JwtGuard } from '../auth/jwtGuard.guard.js';                                                                                                                                  
                                                                                                                                                                                           
    @ApiTags('Reports')                                                                                                                                                           
    @Controller('workspaces/:workspaceId/reports')                                                                                                                                         
    @UseGuards(JwtGuard)                                                                                                                                                                   
    export class ReportsController {                                                                                                                                                       
      constructor(private readonly reportsService: ReportsService) {}                                                                                                                      
                                                                                                                                                                                           
      @ApiOperation({ summary: 'Create a saved report definition' })                                                                                                                       
      @ApiResponse({ status: 201, description: 'Report definition created' })                                                                                                              
      @Post()                                                                                                                                                                              
      async create(                                                                                                                                                                        
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Body() dto: CreateReportDto,                                                                                                                                                      
        @Req() req: any,                                                                                                                                                                   
      ) {                                                                                                                                                                                  
        return this.reportsService.create(workspaceId, dto, req.user.id);                                                                                                                  
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'List saved report definitions for a workspace' })                                                                                                          
      @Get()                                                                                                                                                                               
      async findAll(@Param('workspaceId', ParseIntPipe) workspaceId: number) {                                                                                                             
        return this.reportsService.findAll(workspaceId);                                                                                                                                   
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'View a single report definition and its recent runs' })                                                                                                    
      @Get(':reportId')                                                                                                                                                                    
      async findOne(                                                                                                                                                                       
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Param('reportId', ParseIntPipe) reportId: number,                                                                                                                                 
      ) {                                                                                                                                                                                  
        return this.reportsService.findOne(workspaceId, reportId);                                                                                                                         
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'Update a saved report definition' })                                                                                                                       
      @Patch(':reportId')                                                                                                                                                                  
      async update(                                                                                                                                                                        
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Param('reportId', ParseIntPipe) reportId: number,                                                                                                                                 
        @Body() dto: UpdateReportDto,                                                                                                                                                      
        @Req() req: any,                                                                                                                                                                   
      ) {                                                                                                                                                                                  
        return this.reportsService.update(workspaceId, reportId, dto, req.user.id);                                                                                                        
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'Delete a saved report definition (soft delete)' })                                                                                                         
      @Delete(':reportId')                                                                                                                                                                 
      async remove(                                                                                                                                                                        
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Param('reportId', ParseIntPipe) reportId: number,                                                                                                                                 
        @Req() req: any,                                                                                                                                                                   
      ) {                                                                                                                                                                                  
        return this.reportsService.remove(workspaceId, reportId, req.user.id);                                                                                                             
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'Start generating a new report run' })                                                                                                                      
      @ApiResponse({ status: 201, description: 'Report run queued (PENDING)' })                                                                                                            
      @Post(':reportId/runs')                                                                                                                                                              
      @HttpCode(HttpStatus.CREATED)                                                                                                                                                        
      async triggerRun(                                                                                                                                                                    
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Param('reportId', ParseIntPipe) reportId: number,                                                                                                                                 
        @Req() req: any,                                                                                                                                                                   
      ) {                                                                                                                                                                                  
        return this.reportsService.triggerRun(workspaceId, reportId, req.user.id);                                                                                                         
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'List all generated runs for a report' })                                                                                                                   
      @Get(':reportId/runs')                                                                                                                                                               
      async findRuns(                                                                                                                                                                      
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Param('reportId', ParseIntPipe) reportId: number,                                                                                                                                 
      ) {                                                                                                                                                                                  
        return this.reportsService.findRuns(workspaceId, reportId);                                                                                                                        
      }                                                                                                                                                                                    
                                                                                                                                                                                           
      @ApiOperation({ summary: 'View status and details of one report run' })                                                                                                              
      @Get(':reportId/runs/:runId')                                                                                                                                                        
      async findOneRun(                                                                                                                                                                    
        @Param('workspaceId', ParseIntPipe) workspaceId: number,                                                                                                                           
        @Param('reportId', ParseIntPipe) reportId: number,                                                                                                                                 
        @Param('runId', ParseIntPipe) runId: number,
      ) {
        return this.reportsService.findOneRun(workspaceId, reportId, runId);
      }
  
      @ApiOperation({ summary: 'Download a completed report file (JSON or CSV)' })
      @Get(':reportId/runs/:runId/download')
      async downloadRun(
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('reportId', ParseIntPipe) reportId: number,
        @Param('runId', ParseIntPipe) runId: number,
        @Req() req: any,
      ): Promise<StreamableFile> {
        return this.reportsService.downloadRun(workspaceId, reportId, runId, req.user.id);
      }
    }
