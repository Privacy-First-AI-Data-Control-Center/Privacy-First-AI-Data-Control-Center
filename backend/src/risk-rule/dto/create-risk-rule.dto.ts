import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import { RiskSeverity } from "../enum/risk-severity.enum.js";

export class CreateRiskRuleDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name:string;
    @IsObject()
    condition:Record<string,unknown>;
    @Type(() => Number)
    @IsInt()
    scoreDelta:number;

    @IsEnum(RiskSeverity)
    severity:RiskSeverity;
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
    enabled?:boolean;
}