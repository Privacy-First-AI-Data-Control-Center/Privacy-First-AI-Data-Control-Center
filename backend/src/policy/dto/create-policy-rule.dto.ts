import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, Min } from "class-validator";
import { RuleEffect, RuleType } from "../enums/policy-rule.enum.js";
import { Type } from "class-transformer";

export class CreatePolicyRuleDto{
    @IsEnum(RuleType)
    ruleType:RuleType;
    @IsObject()
    condition:Record<string,unknown>
    @IsEnum(RuleEffect)
    effect:RuleEffect;
    @IsOptional()
    @IsObject()
    actionConfig?:Record<string,unknown>;
    @IsOptional()
    @IsBoolean()
    enabled?:boolean;
    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(()=>Number)
    position?:number;
}