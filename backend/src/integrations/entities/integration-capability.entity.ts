import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Integrations } from "./integration.entity.js";


@Entity()
export class IntegrationCapabilities{
    @PrimaryGeneratedColumn()
    id :number

    @ManyToOne(() => Integrations, (integration) => integration.capabilities, {
            nullable: false,
            onDelete: "CASCADE",
        })
        @JoinColumn()
        integration: Relation<Integrations>;


        @Column({
            type:"varchar",
            length :64 ,
            nullable:false
        })

        capabilityCode:string

        @Column({
            type:"varchar",
            default:"observed",
            length:32
        })
        availability:string

        @Column({
            type: "varchar",
            length: 64,
            default: "hook",
        })
        evidenceSource: string;

        @CreateDateColumn()                                                                                                                                                                
        observedAt: Date; 

        @Column({                                                                                                                                                                          
            type: "jsonb",                                                                                                                                                                 
            nullable: true,                                                                                                                                                                
        })                                                                                                                                                                                 
        details?: Record<string, unknown>;



}

