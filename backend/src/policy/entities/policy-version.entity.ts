import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,CreateDateColumn, DeleteDateColumn,UpdateDateColumn, OneToMany } from "typeorm";
import { Policies } from "./policy.entity.js";
import type { Relation } from "typeorm";
import { Users } from "../../user/entity/users.js";
import { PolicyRules } from "./policy-rule.entity.js";
import { PolicyDecision } from "../../policy-decision/entities/policy-decision.entity.js";
@Entity('policy_versions')
export class PolicyVersions{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>Policies,(policy)=>policy.policy_versions,{nullable:false,onDelete:'RESTRICT'})
    @JoinColumn({name:'policy_id'})
    policy:Relation<Policies>;
    @Column({
        type:'int'
    })
    versionNumber:number;
    @Column({
        type:'jsonb'
    })
    definitionSnapshot:Record<string,unknown>;
    @ManyToOne(()=>Users,(Users)=>Users.policy_versions,{nullable:false,onDelete:'RESTRICT'})
    @JoinColumn({name:'createBy'})
    Users:Relation<Users>
    @CreateDateColumn()
    createdAt:Date;
    @UpdateDateColumn()
    updatedAt:Date;
    @DeleteDateColumn()
    deletedAt:Date;

    @OneToMany(()=>PolicyRules,(policy_rules)=>policy_rules.policyVersion)
    policy_rules:Relation<PolicyRules>[]; 

    @OneToMany(()=>PolicyDecision,(policy_decision)=>policy_decision.policyVersion)
    policy_decisions:Relation<PolicyDecision>[];
}