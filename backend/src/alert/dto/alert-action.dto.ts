import { IsOptional, IsString, MaxLength } from "class-validator";

export class AlertActionDto{
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    note?: string;
}