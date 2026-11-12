import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PolicyDecision } from "../../policy-decision/entities/policy-decision.entity.js";
import type { Relation } from "typeorm";
import { Events } from "../../events/entities/event.entity.js";
import { EnforcementActionType, EnforcementOutcome } from "../enum/enforcement-action.enum.js";
@Entity('enforcement_action')
export class EnforcementAction{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>PolicyDecision,{nullable:false,onDelete:'CASCADE'})
    @JoinColumn()
    policyDecision:Relation<PolicyDecision>;
    
    @Column({
        type:'enum',
        enum:EnforcementActionType
    })
    actionType:EnforcementActionType;
    @Column({
        type:'enum',
        enum:EnforcementOutcome
    })
    outcome:EnforcementOutcome;
    @Column({
        type:'jsonb',default:{}
    })
    evidence:Record<string,unknown>;
    @Column({
        type:'timestamptz',
        default:()=> 'CURRENT_TIMESTAMP'
    })
    performedAt:Date;
    @CreateDateColumn()
    createdAt:Date;
    @UpdateDateColumn()
    updatedAt:Date;
    @DeleteDateColumn()
    deletedAt:Date;
}