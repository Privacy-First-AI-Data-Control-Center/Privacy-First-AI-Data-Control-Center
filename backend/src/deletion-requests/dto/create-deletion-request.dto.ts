import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString, MaxLength } from "class-validator";


export class CreateDeletionRequestDto{
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    from?: Date;
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    to?: Date;
    
    @IsOptional()
    @IsString()
    @MaxLength(64)
    eventTypeCode?: string;
}