import { IsDateString, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, isString } from "class-validator";
import { EnforcementActionType, EnforcementOutcome } from "../enum/enforcement-action.enum.js";

export class ReportEnforcementResultDto {
  @IsNotEmpty()
  policyDecisionId: number;
  @IsNotEmpty()
  @IsEnum(EnforcementActionType)
  actionType: EnforcementActionType;
  @IsNotEmpty()
  @IsEnum(EnforcementOutcome)
  outcome: EnforcementOutcome;
  @IsOptional()
  evidence?: Record<string, unknown>;
}