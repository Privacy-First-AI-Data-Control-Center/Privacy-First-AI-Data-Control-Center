import {                                                                                                                                                                               
        Column,                                                                                                                                                                            
        Entity,                                                                                                                                                                            
        JoinColumn,                                                                                                                                                                        
        ManyToOne,                                                                                                                                                                         
        PrimaryGeneratedColumn,                                                                                                                                                            
    } from "typeorm";                                                                                                                                                                      
    import type { Relation } from "typeorm";                                                                                                                                               
    import { Events } from "./event.entity.js";                                                                                                                                           
                                                                                                                                                                                           
    @Entity()                                                                                                                                                                              
    export class EventAttributes {                                                                                                                                                         
        @PrimaryGeneratedColumn()                                                                                                                                                          
        id: number;                                                                                                                                                                        
                                                                                                                                                                                           
        @ManyToOne(() => Events, (event) => event.attributes, {                                                                                                                            
            nullable: false,                                                                                                                                                               
            onDelete: "CASCADE",                                                                                                                                                           
        })                                                                                                                                                                                 
        @JoinColumn()                                                                                                                                                                      
        event: Relation<Events>;                                                                                                                                                           
                                                                                                                                                                                           
        // e.g. 'tool_name', 'prompt_length', 'file_path', 'exit_code'                                                                                                                     
        @Column({                                                                                                                                                                          
            type: "varchar",                                                                                                                                                               
            length: 128,                                                                                                                                                                   
            nullable: false,                                                                                                                                                               
        })                                                                                                                                                                                 
        attributeKey: string;                                                                                                                                                              
                                                                                                                                                                                           
        // 'string' | 'number' | 'boolean' | 'datetime' | 'json'                                                                                                                           
        @Column({                                                                                                                                                                          
            type: "varchar",                                                                                                                                                               
            length: 32,                                                                                                                                                                    
            nullable: false,                                                                                                                                                               
        })                                                                                                                                                                                 
        valueType: string;                                                                                                                                                                 
                                                                                                                                                                                           
        @Column({                                                                                                                                                                          
            type: "text",                                                                                                                                                                  
            nullable: true,                                                                                                                                                                
        })                                                                                                                                                                                 
        stringValue?: string;                                                                                                                                                              
                                                                                                                                                                                           
        @Column({                                                                                                                                                                          
            type: "double precision",                                                                                                                                                      
            nullable: true,                                                                                                                                                                
        })                                                                                                                                                                                 
        numericValue?: number;                                                                                                                                                             
                                                                                                                                                                                           
        @Column({                                                                                                                                                                          
            type: "boolean",                                                                                                                                                               
            nullable: true,                                                                                                                                                                
        })                                                                                                                                                                                 
        booleanValue?: boolean;                                                                                                                                                            
                                                                                                                                                                                           
        @Column({                                                                                                                                                                          
            type: "timestamp with time zone",                                                                                                                                              
            nullable: true,                                                                                                                                                                
        })
        datetimeValue?: Date;
  
        @Column({
            type: "boolean",
            default: false,
        })
        isSensitive: boolean;
  
        @Column({
            type: "boolean",
            default: false,
        })
        isRedacted: boolean;
    }
