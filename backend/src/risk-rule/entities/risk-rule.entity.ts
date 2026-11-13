import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Workspaces } from "../../workspace/entity/workspaces.js";
import type { Relation } from "typeorm";
import { RiskSeverity } from "../enum/risk-severity.enum.js";
@Entity('risk_rules')
export class RiskRule{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>Workspaces,{nullable:false,onDelete:'CASCADE'})
    @JoinColumn()
    workspace:Relation<Workspaces>;
    @Column({type:'varchar',length:150})
    name:string;
    @Column({type:'jsonb',default:{}})
    condition:Record<string,unknown>;
    @Column({type:'int',default:0})
    scoreDelta:number;
    @Column({type:'enum',enum:RiskSeverity})
    severity:RiskSeverity;
    @Column({type:'boolean',default:true})
    enabled:boolean;
    @CreateDateColumn()
    createdAt:Date;
    @UpdateDateColumn()
    updatedAt:Date;
    @DeleteDateColumn()
    deletedAt:Date;
}