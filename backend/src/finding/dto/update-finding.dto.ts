import { PartialType } from "@nestjs/mapped-types";
import { FindingDto } from "./retrive-finding.dto.js";

export class UpdateFindingDto extends PartialType(FindingDto){

}