import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Severity } from "../enum/Severity.js";
import { Findings } from "../../finding/entities/finding.entity.js";
import type {Relation} from "typeorm";
@Entity('sensitive-data-type')
export class SensitiveDataType{
    @PrimaryGeneratedColumn()
    id:string;
    @Column({
        nullable:false,
        unique:true,
        type: 'varchar'
    })
    code:string;
    @Column({
        nullable:false,
        type: 'varchar'
    })
    name:string;
    @Column({
        nullable:false,
        type: 'varchar'
    })
    detectorKing:string;
    @Column({
        nullable:false,
        type: 'varchar'
    })
    severity:Severity;
    @Column({
        nullable:false,
        type: 'varchar'
    })
    description:string;
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;
    @DeleteDateColumn()
    deletedAt: Date;
    @OneToMany(()=>Findings,(finding)=>finding.sensetiveDataType)
    finding:Relation<Findings[]>
}