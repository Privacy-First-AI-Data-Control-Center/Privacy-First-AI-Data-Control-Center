
import { IsNotEmpty, IsOptional, IsString, Max, MaxLength } from "class-validator";

export class CreateConnectorDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    slug: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    displayName :string 

    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    vendor:string 
    @IsOptional()
    @IsString()
    @MaxLength(512)

    documentationUrl :string

}
