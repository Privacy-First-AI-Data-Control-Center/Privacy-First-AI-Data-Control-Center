import { Type } from "class-transformer";
import {
    IsArray,
    IsISO8601,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
    ValidateNested,
} from "class-validator";

export class EventSourceDto {
    @IsString()
    @IsNotEmpty()
    kind: string;

    @IsString()
    @IsNotEmpty()
    version: string;

    @IsOptional()
    @IsString()
    instance?: string;
}

export class EventRedactionDto {
    @IsNumber()
    redactedCount: number;

    @IsArray()
    @IsString({ each: true })
    appliedRules: string[];

    @IsString()
    timestamp: string;
}

export class NormalizedAgentEventDto {
    @IsUUID()
    eventId: string;

    @IsString()
    @MinLength(16)
    @MaxLength(128)
    dedupeKey: string;

    @IsOptional()
    @IsString()
    schemaVersion?: string;

    @ValidateNested()
    @Type(() => EventSourceDto)
    source: EventSourceDto;

    @IsString()
    @IsNotEmpty()
    eventType: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsISO8601()
    occurredAt: string;

    @IsString()
    confidence: string;

    @IsString()
    severity: string;

    @IsString()
    @MaxLength(1024)
    summary: string;

    @IsOptional()
    @IsString()
    correlationId?: string | null;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown>;

    @IsOptional()
    @ValidateNested()
    @Type(() => EventRedactionDto)
    redaction?: EventRedactionDto;
}
