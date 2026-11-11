import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Workspaces } from "../../workspace/entity/workspaces.js";
import { Users } from "../../user/entity/users.js";
import { DeletionStatus } from "../enum/deletion-status.js";

@Entity('deletion_requests')
@Index(['workspaceId', 'requestedAt'])
export class DeletionRequests{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Workspaces, {
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'workspaceId' })
    workspace: Relation<Workspaces>;
    @Column({
        nullable: false,
        type: 'int'
    })
    workspaceId: number;

    
    @ManyToOne(() => Users, {
        nullable: true,
        onDelete: 'SET NULL'
    })
    @JoinColumn({ name: 'requestedBy' })
    requestedByUser: Relation<Users> | null;
    @Column({
        nullable: true,
        type: 'int'
    })
    requestedBy: number | null;

   
    @Column({
        nullable: false,
        type: 'jsonb'
    })
    scope: any;

    @Column({
        nullable: false,
        type: 'enum',
        enum: DeletionStatus,
        default: DeletionStatus.PENDING
    })
    status: DeletionStatus;

   
    @Column({
        nullable: true,
        type: 'jsonb'
    })
    verification: any;

    @Column({
        nullable: true,
        type: 'varchar'
    })
    errorCode: string | null;

    @CreateDateColumn()
    requestedAt: Date;

    @Column({
        nullable: true,
        type: 'timestamp'
    })
    completedAt: Date | null;
}