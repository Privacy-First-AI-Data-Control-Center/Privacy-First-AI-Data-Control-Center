import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { PolicyStatus } from "../enums/policy-status.enum.js";
import { CreatePolicyRuleDto } from "./create-policy-rule.dto.js";

export class CreatePolicyDto{
    // @IsInt()
    // @Type(()=>Number)
    // @IsNotEmpty()
    // worksapceId:number;
    // @IsInt()
    // @Type(()=>Number)
    // @IsNotEmpty()
    // createdBy:number;
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name:string;
    @IsOptional()
    @IsString()
    description:string;
    @IsOptional()
    @IsEnum(PolicyStatus)
    status:PolicyStatus;
    @IsOptional()
    @IsInt()
    @Type(()=>Number)
    priority:number;
    @IsOptional()
    @IsArray()
    @ValidateNested({each:true})
    @Type(()=>CreatePolicyRuleDto)
    rules:CreatePolicyRuleDto[];
}