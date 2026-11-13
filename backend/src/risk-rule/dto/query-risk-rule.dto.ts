import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { RiskSeverity } from "../enum/risk-severity.enum.js";

export class QueryRiskRuleDto {
    @IsOptional()
    @IsEnum(RiskSeverity)
    severity?: RiskSeverity;

    @IsOptional()
    @IsBoolean()
    enabled?: boolean;
}