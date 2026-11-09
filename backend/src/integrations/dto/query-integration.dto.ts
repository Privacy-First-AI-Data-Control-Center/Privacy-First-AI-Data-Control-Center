import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsPositive, Min,Max } from "class-validator";
import { IntegrationStatus } from "../enum/integration-status.js";

export class QueryIntegrationDto{


     @IsOptional()                                                                                                                                                                      
        @Type(() => Number)                                                                                                                                                                
        @IsInt()                                                                                                                                                                           
        @IsPositive()                                                                                                                                                                      
        workspaceId?: number;                                                                                                                                                              
                                                                                                                                                                                           
        @IsOptional()                                                                                                                                                                      
        @IsEnum(IntegrationStatus)                                                                                                                                                         
        status?: IntegrationStatus;                                                                                                                                                        
                                                                                                                                                                                           
        @IsOptional()                                                                                                                                                                      
        @Type(() => Number)                                                                                                                                                                
        @IsInt()                                                                                                                                                                           
        @Min(1)                                                                                                                                                                            
        page?: number = 1;                                                                                                                                                                 
                                                                                                                                                                                           
        @IsOptional()                                                                                                                                                                      
        @Type(() => Number)                                                                                                                                                                
        @IsInt()                                                                                                                                                                           
        @Min(1)                                                                                                                                                                            
        @Max(100)                                                                                                                                                                          
        limit?: number = 20;
}