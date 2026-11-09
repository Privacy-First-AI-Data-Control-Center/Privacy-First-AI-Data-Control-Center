import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator"

export class RegisterCapabilityDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    capabilityCode :string 
    @IsOptional()

    @IsString()
    @MaxLength(32)
    availability? :string
    @IsOptional()

    @IsString()
    @MaxLength(64)

    evidenceSource? :string 
    @IsOptional(  )
    @IsString ()

    details? :string



}