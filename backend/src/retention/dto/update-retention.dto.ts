import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";


export class UpdateRetentionDto{
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(3650)
    retentionDays?: number;
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;
}