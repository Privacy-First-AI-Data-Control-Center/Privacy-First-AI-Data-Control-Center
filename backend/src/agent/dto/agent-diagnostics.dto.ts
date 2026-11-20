import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentDiagnosticsDto {
  @ApiProperty({ description: 'Unique installation ID of the reporting agent', example: 'inst-1234-abcd' })
  @IsString()
  @IsNotEmpty()
  installationId: string;

  @ApiProperty({ description: 'Device ID associated with the agent', example: 1 })
  @IsInt()
  @IsNotEmpty()
  deviceId: number;

  @ApiPropertyOptional({ description: 'Log level or severity of diagnostic intake', example: 'INFO' })
  @IsString()
  @IsOptional()
  level?: string;

  @ApiPropertyOptional({ description: 'Diagnostic message or summary', example: 'Local connector sync ok' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: 'System diagnostic telemetry', example: { os: 'linux', uptime: 3600 } })
  @IsOptional()
  systemInfo?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Diagnostic log entries', example: [{ timestamp: '2026-11-21T01:00:00Z', msg: 'Started' }] })
  @IsOptional()
  logs?: any[];
}
