import { IsDateString, IsNotEmpty, IsObject, IsOptional, IsString, isString } from "class-validator";

export class ReportEnforcementResultDto{
    @IsOptional()
    @IsString()
    policyDecisionId?:string;
    @IsOptional()
    @IsString()
    eventId?: string;
    @IsOptional()
    @IsString()
    deviceId?: string;
    @IsNotEmpty()
    actionType: string;
    @IsNotEmpty()
    outcome: string;
    @IsOptional()
    @IsObject()
    evidence?: Record<string, unknown>;
    @IsOptional()
    @IsDateString()
    performedAt?: string;
}