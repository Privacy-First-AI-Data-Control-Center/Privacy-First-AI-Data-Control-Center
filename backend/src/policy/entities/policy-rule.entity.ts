import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PolicyVersions } from "./policy-version.entity.js";
import type { Relation } from "typeorm";
import { RuleEffect, RuleType } from "../enums/policy-rule.enum.js";
@Entity('policy_rules')
export class PolicyRules{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>PolicyVersions,(policy_versions)=>policy_versions.policy_rules,{nullable:false,onDelete:'CASCADE'})
    @JoinColumn({name:'policyversionId'})
    policyVersion:Relation<PolicyVersions>;
    @Column({
        type:'enum',
        enum:RuleType
    })
    ruleType:RuleType;
    @Column({
        type:'jsonb'
    })
    condition:Record<string,unknown>;
    @Column({
        type:'enum',
        enum:RuleEffect,
    })
    effect:RuleEffect;

    @Column({
        type:'jsonb',
        nullable:true
    })
    actionConfig:Record<string,unknown>|null;
    @Column({
        type:'boolean',default:true
    })
    enabled:boolean;
    @Column({
        type:'int',
        default:0
    })
    position:number;
}