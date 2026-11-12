import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Events } from "../../events/entities/event.entity.js";
import type { Relation } from "typeorm";
import { PolicyVersions } from "../../policy/entities/policy-version.entity.js";
import { RuleEffect } from "../../policy/enums/policy-rule.enum.js";
import { EvaluationStatus } from "../enum/evaluation-status.enum.js";
@Entity('policy_decision')
export class PolicyDecision {
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>Events,{nullable:false,onDelete:'CASCADE'})
    @JoinColumn()
    event:Relation<Events>;
    @ManyToOne(()=>PolicyVersions,{nullable:false,onDelete:'CASCADE'})
    @JoinColumn()
    policyVersion:Relation<PolicyVersions>;
    @Column({type:'enum',enum:RuleEffect})
    decision:RuleEffect;
    @Column({type:'text'})
    reason:string;
    @Column({type:'enum',enum:EvaluationStatus})
    evaluationStatus:EvaluationStatus;
    @Column({type:'int',})
    evaluationLatencyMs:number;
    @CreateDateColumn()
    evaluatedAt:Date;
    @UpdateDateColumn()
    updatedAt:Date;
    @DeleteDateColumn()
    deletedAt:Date;

}
