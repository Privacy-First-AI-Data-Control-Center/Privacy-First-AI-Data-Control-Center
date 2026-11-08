import { Type } from "class-transformer";
import { IsDate, IsInt, IsOptional, IsString } from "class-validator";


export class QueryAuditLogsDto
{
    @IsOptional()
    @IsString()
    action?: string;
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    actorUserId?: number;
    @IsOptional()
    @IsString()
    targetType?: string;
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    from?: Date;
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    to?: Date;
}