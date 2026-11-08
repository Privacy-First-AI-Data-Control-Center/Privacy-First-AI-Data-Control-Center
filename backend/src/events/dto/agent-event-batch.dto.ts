import { Type } from "class-transformer";
import { IsArray, IsISO8601, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { NormalizedAgentEventDto } from "./normalized-agent-event.dto.js";

export class AgentEventBatchDto {
    @IsString()
    @IsNotEmpty()
    deviceId: string;

    @IsISO8601()
    sentAt: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NormalizedAgentEventDto)
    events: NormalizedAgentEventDto[];
}
