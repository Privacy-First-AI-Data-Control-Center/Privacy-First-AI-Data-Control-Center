import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentHeartbeatDto {
  @ApiProperty({ description: 'Unique installation ID of the reporting agent', example: 'inst-1234-abcd' })
  @IsString()
  @IsNotEmpty()
  installationId: string;

  @ApiPropertyOptional({ description: 'Device ID associated with the agent', example: 1 })
  @IsInt()
  @IsOptional()
  deviceId?: number;

  @ApiPropertyOptional({ description: 'Agent software version', example: '1.0.0' })
  @IsString()
  @IsOptional()
  agentVersion?: string;

  @ApiPropertyOptional({ description: 'Current status reported by the agent', example: 'ACTIVE' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Diagnostic or performance metrics reported with heartbeat', example: { cpuPercent: 12.5, memoryMb: 128 } })
  @IsOptional()
  metrics?: Record<string, any>;
}
