import { IsDecimal, IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import {Type} from 'class-transformer'
import { FindingStatus } from "../enum/finding-status.enum.js";

export class FindingDto{
    @IsNumber()
    @IsNotEmpty()
    @Type(()=> Number)
    eventId:number;
    @IsString()
    @IsNotEmpty()
    sensitiveDataTypeId:string;
    @IsString()
    @IsNotEmpty()
    locationReference:string;
    @IsDecimal()
    @IsNotEmpty()
    confidence:number;
    @IsNumber()
    @IsNotEmpty()
    @Type(()=> Number)
    matchCount:number;
    @IsString()
    @IsNotEmpty()
    maskedEvidence:string;
    @IsEnum(FindingStatus)
    @IsNotEmpty()
    status:string;
    @IsString()
    @IsNotEmpty()
    recemmendation:string;
}