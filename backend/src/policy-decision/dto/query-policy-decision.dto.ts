import { Query } from "@nestjs/common";
import { RuleEffect } from "../../policy/enums/policy-rule.enum.js";
import { IsEnum, IsInt, IsOptional } from "class-validator";
import { EvaluationStatus } from "../enum/evaluation-status.enum.js";
import { Type } from "class-transformer";

export class QueryPolicyDecisionDto {
    @IsOptional()
    @IsEnum(RuleEffect)
    decision?:RuleEffect;

    @IsOptional()
    @IsEnum(EvaluationStatus)
    evaluationStatus?:EvaluationStatus
    @IsOptional()
    @IsInt()
    @Type(()=>Number)
    policyId?:number;
    @IsOptional()
    @IsInt()
    @Type(()=>Number)
    eventId?:number;
}