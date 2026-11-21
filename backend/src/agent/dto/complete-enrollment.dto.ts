import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteEnrollmentDto {
  @ApiProperty({ description: 'ID of the enrolled device', example: 1 })
  @IsInt()
  @IsNotEmpty()
  deviceId: number;

  @ApiProperty({ description: 'Unique agent installation identifier', example: 'inst-1234-abcd' })
  @IsString()
  @IsNotEmpty()
  installationId: string;

  @ApiProperty({ description: 'Version of the installed agent software', example: '1.0.0' })
  @IsString()
  @IsNotEmpty()
  agentVersion: string;

  @ApiPropertyOptional({ description: 'Platform OS type', example: 'linux' })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional({ description: 'OS version details', example: 'Ubuntu 22.04' })
  @IsString()
  @IsOptional()
  osVersion?: string;

  @ApiPropertyOptional({ description: 'Machine hostname', example: 'dev-box' })
  @IsString()
  @IsOptional()
  hostName?: string;
}
