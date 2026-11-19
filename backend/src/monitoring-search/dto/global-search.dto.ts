import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const SEARCH_SCOPES = [
  'all',
  'events',
  'policies',
  'integrations',
  'alerts',
  'reports',
] as const;

export type SearchScope = (typeof SEARCH_SCOPES)[number];

export class GlobalSearchDto {
  @ApiProperty({ example: 'secret', description: 'Search keyword' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  q: string;

  @ApiPropertyOptional({
    enum: SEARCH_SCOPES,
    default: 'all',
    description: 'Limit search to a specific resource type',
  })
  @IsOptional()
  @IsIn(SEARCH_SCOPES)
  type?: SearchScope;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
