import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Events } from "./event.entity.js";

@Entity()
export class EventTypes {
    @PrimaryGeneratedColumn()
    id :number
    @Column({
        type :"varchar",
        length:64 ,
        nullable:false,
        unique:true
    })
    code :string
    @Column({
            type: "varchar",
            length: 128,
            nullable: false,
        })
        name: string;
  
        @Column({
            type: "varchar",
            length: 64,
            nullable: false,
        })
        category: string;



        @Column({
            type: "text",
            nullable: true,
        })                                                                                                                                                                                 
        description?: string;
       
  
        @CreateDateColumn()
        createdAt: Date;
  
        @UpdateDateColumn()
        updatedAt: Date;

        @OneToMany(()=>Events ,(event)=>event.eventType)
        events :Relation<Events>[]


}
