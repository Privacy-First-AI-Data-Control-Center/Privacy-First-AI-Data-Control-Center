import { Type } from "class-transformer";
import { IsArray, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsPositive, IsString, ValidateNested } from "class-validator";
import { NormalizedAgentEventDto } from "./normalized-agent-event.dto.js";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AgentEventBatchDto {
    @ApiProperty({ example: 'shohag-dev-pc', description: 'Unique device identifier' })
    @IsString()
    @IsNotEmpty()
    deviceId: string;

    @ApiPropertyOptional({ example: 10, description: 'Optional target workspace ID bound to this local agent' })
    @IsOptional()
    @IsInt()
    @IsPositive()
    @Type(() => Number)
    workspaceId?: number;

    @IsISO8601()
    sentAt: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NormalizedAgentEventDto)
    events: NormalizedAgentEventDto[];
}
