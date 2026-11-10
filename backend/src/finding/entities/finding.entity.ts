import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SensitiveDataType } from "../../sensitive-data-type/entity/SensitiveDataType.js";
import { Events } from "../../events/entities/event.entity.js";
import type { Relation } from "typeorm";
import { FindingStatus } from "../enum/finding-status.enum.js";

@Entity('findings')
export class Findings{
    @PrimaryGeneratedColumn()
    id:string;
    @ManyToOne(()=>Events,{ nullable: false, onDelete: "CASCADE" })
    @JoinColumn()
    event:Relation<Events>;
    @ManyToOne(() => SensitiveDataType, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn()
    sensetiveDataType:Relation<SensitiveDataType>;
    // eventId:number;
    // sensitiveTypeId:string;
    @Column({
        type:'varchar',
        nullable:false,
    })
    locationReference:string;
    @Column({
        type:'decimal',
        precision:4,
        nullable:false,
    })
    confidence:number;
    @Column({
        type:'int',
        nullable:false,
    })
    matchCount:number;
    @Column({
        type:'varchar',
        nullable:true,
    })
    maskedEvidence:string;
    @Column({
        type:'enum',
        enum:FindingStatus,
        default:FindingStatus.OPEN,
    })
    status:string;
    @Column({
        type:'text',
        nullable:true,
    })
    recemmendation:string;
    @Column({
        type:'timestamp'
    })
    DetectedAt:Date;
    @CreateDateColumn()
    createdAt:Date;
    @UpdateDateColumn()
    updatedAt:Date;
    @DeleteDateColumn()
    deletedAt:Date;
}