import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { Role } from "../enum/role.js";
import { AccountStatus } from "../enum/account-status.js";
import { Workspaces } from "../../workspace/entity/workspaces.js";
import { WorkspaceMembers } from "../../workspace-member/entity/workspace-members.js";

@Entity()
export class Users{
    @PrimaryGeneratedColumn()
    id: number;
    @Column({
        nullable: false,
        unique: true,
        type: 'varchar'
    })
    email: string;
    @Column({
        nullable: false,
        unique: true,
        type: 'varchar'
    })
    username: string;
    @Column({
        nullable: false,
        type: 'varchar'
    })
    passwordHash: string;
    @Column({
        nullable: false,
        type: 'varchar'
    })
    displayName: string;
    @Column({
        nullable: false,
        type: 'enum',
        enum: Role,
    })
    role: Role
    @Column({
        nullable: false,
        type: 'enum',
        enum: AccountStatus,
        default: AccountStatus.PENDING_VERIFICATION
    })
    accountStatus: AccountStatus;
    @Column({
        nullable: true,
        type: 'timestamp'
    })
    emailVerifiedAt: Date;
    @Column({
        nullable: true,
        type: 'timestamp'
    })
    lastLoginAt: Date;
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;
    @DeleteDateColumn()
    deletedAt: Date;

    //relations
    @OneToMany(()=> Workspaces, (workspaces)=> workspaces.ownerUser)
    workspaces: Relation<Workspaces>[];
    @OneToMany(()=> WorkspaceMembers, (workspaceMembers)=> workspaceMembers.user)
    workspaceMembers: Relation<WorkspaceMembers>[];
}