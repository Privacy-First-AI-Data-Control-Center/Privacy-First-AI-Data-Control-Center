import { PartialType } from "@nestjs/mapped-types";
import { CreatePolicyDto } from "./create-policy.dto.js";

export class partialUpdatePolicyDto extends PartialType(CreatePolicyDto){
    
}