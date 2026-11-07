import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from 'typeorm';
import { Users } from "../../user/entity/users.js";
import { WorkspaceType } from "../enum/workspace-type.js";
import { WorkspaceStatus } from "../enum/workspace-status.js";
import { WorkspaceMembers } from "../../workspace-member/entity/workspace-members.js";

@Entity()
export class Workspaces{
    @PrimaryGeneratedColumn()
    id: number;
    @Column({
        nullable: false,
        type: 'varchar'
    })
    name: string;
    @Column({
        nullable: false,
        type: 'enum',
        enum: WorkspaceType,
        default: WorkspaceType.PERSONAL
    })
    workspaceType: WorkspaceType;
    @ManyToOne(() => Users, (user)=> user.workspaces, {
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    ownerUser: Relation<Users>;
    @Column({
        nullable: false,
        type: 'enum',
        enum: WorkspaceStatus,
        default: WorkspaceStatus.ACTIVE
    })
    workspaceStatus: WorkspaceStatus;
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;
    @DeleteDateColumn()
    deletedAt: Date;

    //relations
    @OneToMany(()=> WorkspaceMembers, (workspaceMembers)=> workspaceMembers.workspace)
    workspaceMembers: Relation<WorkspaceMembers>[];
}