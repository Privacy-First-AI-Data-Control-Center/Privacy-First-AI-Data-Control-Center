import { IsEnum, IsInt, IsOptional } from "class-validator";
import { RiskSeverity } from "../../risk-rule/enum/risk-severity.enum.js";
import { Type } from "class-transformer";

export class QueryRiskFindingDto{
    @IsOptional()
    @IsEnum(RiskSeverity)
    severity?:RiskSeverity;
    @IsOptional()
    @Type(()=>Number)
    @IsInt()
    riskRuleId?:number;
    @IsOptional()
    @Type(()=>Number)
    @IsInt()
    eventId?:number;
}