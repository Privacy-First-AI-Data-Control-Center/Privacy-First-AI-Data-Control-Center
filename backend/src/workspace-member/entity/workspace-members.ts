import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from 'typeorm';
import { Role } from "../../user/enum/role.js";
import { Users } from "../../user/entity/users.js";
import { Workspaces } from "../../workspace/entity/workspaces.js";

@Entity()
export class WorkspaceMembers{
    @PrimaryGeneratedColumn()
    id: number;
    @ManyToOne(() => Workspaces, (workspace)=> workspace.workspaceMembers, {
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    workspace: Relation<Workspaces>;
    @ManyToOne(() => Users, (user)=> user.workspaceMembers, {
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    user: Relation<Users>;
    @Column({
        nullable:false,
        type: 'enum',
        enum: Role
    })
    role: Role;
    @CreateDateColumn()
    joinedAt: Date;
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;
    @DeleteDateColumn()
    deletedAt: Date; 
}