import { PartialType } from "@nestjs/mapped-types";
import { CreatePolicyRuleDto } from "./create-policy-rule.dto.js";

export class updatePolicyRuleDto extends PartialType(CreatePolicyRuleDto){
    
}