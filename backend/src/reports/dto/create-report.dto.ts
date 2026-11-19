import { Type } from 'class-transformer';
    import {
      IsArray,
      IsDefined,
      IsEnum,
      IsISO8601,
      IsNotEmpty,
      IsOptional, 
      IsString,
      MaxLength,
      ValidateNested,
    } from 'class-validator';
    import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
    import { ReportType } from '../enum/report-type.enum.js';
    import { ReportFormat } from '../enum/report-format.enum.js';
  
    export class ReportDefinitionDto {
      @ApiPropertyOptional({ enum: ReportType, default: ReportType.EXECUTIVE_SUMMARY })

      @IsOptional()
      @IsEnum(ReportType)
      
      reportType?: ReportType; 

  
      @ApiPropertyOptional({ enum: ReportFormat, default: ReportFormat.JSON })
      @IsOptional()
      @IsEnum(ReportFormat)
      format?: ReportFormat;
  
      @ApiPropertyOptional({ example: '2026-11-01T00:00:00Z' })
      @IsOptional()
      @IsISO8601()
      from?: string;
  
      @ApiPropertyOptional({ example: '2026-11-19T23:59:59Z' })
      @IsOptional()
      @IsISO8601()
      to?: string;
  
      @ApiPropertyOptional({
        type: [String],
        example: ['events', 'findings', 'policies', 'alerts', 'integrations'],
      })
      @IsOptional()                                                                                                                                                                        
      @IsArray()                                                                                                                                                                           
      @IsString({ each: true })                                                                                                                                                            
      sections?: string[];                                                                                                                                                                 
    }                                                                                                                                                                                      
                                                                                                                                                                                           
    export class CreateReportDto {                                                                                                                                                         
      @ApiProperty({ example: 'Weekly Workspace Privacy Report' })                                                                                                                         
      @IsString()                                                                                                                                                                          
      @IsNotEmpty()                                                                                                                                                                        
      @MaxLength(160)                                                                                                                                                                      
      title: string;                                                                                                                                                                       
                                                                                                                                                                                           
      @ApiProperty({ type: ReportDefinitionDto })                                                                                                                                          
      @IsDefined()                                                                                                                                                                         
      @ValidateNested()                                                                                                                                                                    
      @Type(() => ReportDefinitionDto)                                                                                                                                                     
      definition: ReportDefinitionDto;                                                                                                                                                     
    }   