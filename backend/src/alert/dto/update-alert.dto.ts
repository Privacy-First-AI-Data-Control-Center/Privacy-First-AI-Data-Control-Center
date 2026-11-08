import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { AlertSeverity } from "../enum/alert-severity.js";


export class UpdateAlertDto{
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;
    @IsOptional()
    @IsEnum(AlertSeverity)
    severity?: AlertSeverity;
}