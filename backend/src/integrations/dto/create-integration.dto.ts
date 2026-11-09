import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";
import { IntegrationStatus } from "../enum/integration-status.js";

export class CreateIntegrationDto {

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    workspaceId :number
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()

     connectorTypeId :number
     @IsOptional()
     @IsString()
     @MaxLength(128)



     deviceId? :string
     @IsString()
     @IsNotEmpty()
     @MaxLength(128)
     displayName :string

     @IsOptional()
  @IsString()
   @MaxLength(32)
     version?: string;

     @IsOptional()
     @IsEnum(IntegrationStatus)
     status?:IntegrationStatus

     @IsOptional()
      @IsString()
        @MaxLength(256)
        secretReference?: string;




}
