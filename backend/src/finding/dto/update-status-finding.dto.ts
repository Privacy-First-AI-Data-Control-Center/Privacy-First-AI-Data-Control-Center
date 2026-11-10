import { IsEnum } from "class-validator";
import { FindingStatus } from "../enum/finding-status.enum.js";

export class UpdateFindingStatusDto{
    @IsEnum(FindingStatus)
    status!:FindingStatus;
}