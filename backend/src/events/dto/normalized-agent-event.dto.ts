import { Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
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
    sourceKind: string; // e.g. 'connector_hook'

    @IsString()
    @IsNotEmpty()
    connectorVersion: string; // e.g. '1.0.0'

    @IsString()
    @IsNotEmpty()
    deviceId: string; // e.g. 'local-unregistered-device' or device ID

    @IsOptional()
    @IsString()
    integration?: string; // e.g. 'claude-code', 'antigravity'
}

export class EventRedactionDto {
    @IsBoolean()
    applied: boolean;

    @IsArray()
    @IsString({ each: true })
    rules: string[];

    @IsNumber()
    redactedCount: number;
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
