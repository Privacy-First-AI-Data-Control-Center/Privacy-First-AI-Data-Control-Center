import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Events } from "../../events/entities/event.entity.js";
import type { Relation } from "typeorm";
import { RiskRule } from "../../risk-rule/entities/risk-rule.entity.js";
import { RiskSeverity } from "../../risk-rule/enum/risk-severity.enum.js";
import { Delete } from "@nestjs/common";
@Entity('risk_findings')
export class RiskFinding{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>Events,{nullable:false,onDelete:'CASCADE'})
    @JoinColumn()
    event:Relation<Events>;

    @ManyToOne(()=> RiskRule,{nullable:false,onDelete:'CASCADE'})
    @JoinColumn()
    riskRule:Relation<RiskRule>;
    @Column({type:'int'})
    riskScore:number;
    @Column({type:'enum',enum:RiskSeverity})
    severity:RiskSeverity;
    @Column({type:'text'})
    explanation:string;
    @CreateDateColumn()
    createdAt:Date;
    @UpdateDateColumn()
    updatedAt:Date;
    @DeleteDateColumn()
    deletedAt:Date;
}
