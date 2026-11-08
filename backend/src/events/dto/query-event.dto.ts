import { Type } from "class-transformer";                                                                                                                                              
    import { IsISO8601, IsInt, IsOptional, IsPositive, IsString, Max, Min } from "class-validator";                                                                                        
                                                                                                                                                                                           
    export class QueryEventsDto {                                                                                                                                                          
        @IsOptional()                                                                                                                                                                      
        @Type(() => Number)                                                                                                                                                                
        @IsInt()                                                                                                                                                                           
        @IsPositive()                                                                                                                                                                      
        workspaceId?: number;                                                                                                                                                              
                                                                                                                                                                                           
        @IsOptional()                                                                                                                                                                      
        @Type(() => Number)                                                                                                                                                                
        @IsInt()                                                                                                                                                                           
        @IsPositive()                                                                                                                                                                      
        integrationId?: number;                                                                                                                                                            
                                                                                                                                                                                           
        @IsOptional()                                                                                                                                                                      
        @IsString()                                                                                                                                                                        
        eventType?: string;                                                                                                                                                                
                                                                                                                                                                                           
        @IsOptional()                                                                                                                                                                      
        @IsString()                                                                                                                                                                        
        severity?: string;                                                                                                                                                                 
                                                                                                                                                                                           
        @IsOptional()                                                                                                                                                                      
        @IsString()                                                                                                                                                                        
        deviceId?: string;                                                                                                                                                                 
                                                                                                                                                                                           
        @IsOptional()                                                                                                                                                                      
        @IsISO8601()                                                                                                                                                                       
        from?: string;                                                                                                                                                                     
                                                                                                                                                                                           
        @IsOptional()                                                                                                                                                                      
        @IsISO8601()                                                                                                                                                                       
        to?: string;                                                                                                                                                                       
                                                                                                                                                                                           
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
        limit?: number = 50;                                                                                                                                                               
    } 