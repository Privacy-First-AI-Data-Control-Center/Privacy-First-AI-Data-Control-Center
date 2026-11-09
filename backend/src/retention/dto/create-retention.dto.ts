import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, Max, Min } from "class-validator";
import { RetentionEntityType } from "../enum/retention-entity-type.js";

export class CreateRetentionDto{
    @IsNotEmpty()
    @IsEnum(RetentionEntityType)
    entityType: RetentionEntityType;
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(3650)
    retentionDays: number;
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;
}