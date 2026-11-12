import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { ExportFormat } from "../enum/export-type.js";

export class CreateExportDto{
    @IsNotEmpty()
    @IsEnum(ExportFormat)
    format: ExportFormat;
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