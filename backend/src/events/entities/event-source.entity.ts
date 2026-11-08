import { Entity, ManyToOne, PrimaryGeneratedColumn ,Column, CreateDateColumn, OneToMany} from "typeorm";
import { Integrations } from "../../integrations/entities/integration.entity.js";
import type { Relation } from "typeorm";
import { Events } from "./event.entity.js";
@Entity()
export class EventSources {
    @PrimaryGeneratedColumn()
    id :number

    @ManyToOne (()=>Integrations ,{onDelete:"SET NULL",nullable:true})
    integrations :Relation<Integrations>


     @Column({
            type: "varchar",
            length: 64,
            nullable: false,
        })
        sourceKind: string;
  
        @Column({
            type: "varchar",
            length: 32,
            default: "1.0.0",
        })
        sourceVersion: string;
  
        @Column({
            type: "varchar",
            length: 128,
            nullable: true,
        })
        sourceInstance?: string;
  
        @CreateDateColumn() 
        createdAt: Date;
                                                                                                                                                                                           
        @OneToMany(() => Events, (event) => event.eventSource)                                                                                                                             
        events: Relation<Events>[]; 

}