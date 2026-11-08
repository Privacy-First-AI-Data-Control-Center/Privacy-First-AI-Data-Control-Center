import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";
import { AlertType } from "../enum/alert-type.js";
import { AlertSeverity } from "../enum/alert-severity.js";

export class CreateAlertDto{
    @IsOptional()
    @IsInt()
    @IsPositive()
    riskFindingId?: number;
    @IsNotEmpty()
    @IsEnum(AlertType)
    alertType: AlertType;
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    title: string;
    @IsNotEmpty()
    @IsEnum(AlertSeverity)
    severity: AlertSeverity;
}