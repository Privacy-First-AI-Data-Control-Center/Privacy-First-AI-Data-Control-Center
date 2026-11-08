import { IsInt, IsOptional, IsPositive, IsString, MaxLength, ValidateIf } from "class-validator";

export class AssignAlertDto{
   
    @ValidateIf((o) => o.assignedUserId !== null)
    @IsInt()
    @IsPositive()
    assignedUserId: number | null;
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    note?: string;
}