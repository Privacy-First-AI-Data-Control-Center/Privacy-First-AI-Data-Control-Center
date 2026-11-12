import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

export class TestPolicyDto{
    @IsOptional()
    @IsInt()
    @Type()
    versionId?:number;
    @IsOptional()
    @IsString()
    eventType?:string;
    @IsOptional()
    @IsString()
    integration?:string;
    @IsOptional()
    @IsArray()
    @IsString()
    sensitiveType?:string[];
}