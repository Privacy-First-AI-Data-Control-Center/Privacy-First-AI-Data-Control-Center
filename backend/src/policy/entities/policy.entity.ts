import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Workspaces } from "../../workspace/entity/workspaces.js";
import type { Relation } from "typeorm";
import { Users } from "../../user/entity/users.js";
import { PolicyStatus } from "../enums/policy-status.enum.js";
import { PolicyVersions } from "./policy-version.entity.js";
@Entity('policy')
export class Policies{
    @PrimaryGeneratedColumn()
    id:number;
    @ManyToOne(()=>Workspaces,(workspace)=>workspace.policy,{nullable:false,onDelete:'CASCADE'})
    @JoinColumn()
    workspace:Relation<Workspaces>;
    @ManyToOne(()=>Users,(Users)=>Users.policy,{nullable:false,onDelete:'CASCADE'})
    @JoinColumn({name:'createBy'})
    Users:Relation<Users>
    @Column({
        type:"varchar",
        length:120
    })
    name:string;
    @Column({
        type:'text',
        nullable:true,
    })
    description:string;
    @Column({
        type:'enum',
        enum:PolicyStatus,
        default:PolicyStatus.DISABLED,
    })
    status:PolicyStatus;
    @Column({
        type:'int',
    })
    priority:number;

    @OneToMany(()=>PolicyVersions,(policy_versions)=>policy_versions.policy)
    policy_versions:Relation<PolicyVersions>[];  

    @CreateDateColumn()
    createdAt:Date;
    @UpdateDateColumn()
    updatedAt:Date;
    @DeleteDateColumn()
    deletedAt:Date;


}