import { Type } from "class-transformer";
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { AlertStatus } from "../enum/alert-status.js";
import { AlertSeverity } from "../enum/alert-severity.js";
import { AlertType } from "../enum/alert-type.js";

export class QueryAlertDto{
    @IsOptional()
    @IsEnum(AlertStatus)
    status?: AlertStatus;
    @IsOptional()
    @IsEnum(AlertSeverity)
    severity?: AlertSeverity;
    @IsOptional()
    @IsEnum(AlertType)
    alertType?: AlertType;
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    assignedUserId?: number;
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    from?: Date;
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    to?: Date;
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;
}