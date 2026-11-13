import { PartialType } from "@nestjs/mapped-types";
import { CreateRiskRuleDto } from "./create-risk-rule.dto.js";

export class UpdateRiskRuleDto extends PartialType(CreateRiskRuleDto) {}