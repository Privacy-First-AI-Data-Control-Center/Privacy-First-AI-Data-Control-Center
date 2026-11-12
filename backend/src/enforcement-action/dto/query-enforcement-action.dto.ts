import { IsEnum, IsInt, IsOptional, } from "class-validator";
import { EnforcementActionType, EnforcementOutcome } from "../enum/enforcement-action.enum.js";
import { Type } from "class-transformer";
export class QueryEnforcementActionDto{
    @IsOptional()
    @IsEnum(EnforcementActionType)
    actionType?:EnforcementActionType;
    @IsOptional()
    @IsEnum(EnforcementOutcome)
    outcome?:EnforcementOutcome;
    @IsOptional()
    @Type(()=>Number)
    @IsInt()
    policyDecisionId?:number;
}