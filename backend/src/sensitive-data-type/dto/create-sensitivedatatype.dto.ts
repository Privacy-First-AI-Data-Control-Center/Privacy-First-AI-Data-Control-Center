import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { Severity } from "../enum/Severity.js";

export class SensitiveDataTypeDto{
    @IsNotEmpty()
    @IsString()
    code:string;
    @IsNotEmpty()
    @IsString()
    name:string;
    @IsNotEmpty()
    @IsString()
    detectorKind:string;
    @IsNotEmpty()
    @IsString()
    @IsEnum(Severity)
    severity:Severity;
    @IsNotEmpty()
    @IsString()
    description:string;
}