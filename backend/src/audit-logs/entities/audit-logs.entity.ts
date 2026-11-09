import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,  } from "typeorm";
import { Workspaces } from "../../workspace/entity/workspaces.js";
import type { Relation } from "typeorm";
import { Users } from "../../user/entity/users.js";
import { ActorType } from "../enum/actor-type.js";


@Entity('audit-logs')
@Index(['workspaceId', 'occurredAt'])
export class AuditLogs
{
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
    @JoinColumn({ name: 'actorUserId' })
    actorUser: Relation<Users> | null;
    @Column({
        nullable: true,
        type: 'int'
    })
    actorUserId: number | null;

    @Column({
        nullable: false,
        type: 'enum',
        enum: ActorType,
        default: ActorType.USER
    })
    actorType: ActorType;
    @Column({
        nullable: false,
        type: 'varchar'
    })
    action: string;
    @Column({
        nullable: false,
        type: 'varchar'
    })
    targetType: string;
    @Column({
        nullable: true,
        type: 'varchar'
    })
    targetId: string | null;
    @Column({
        nullable: true,
        type: 'jsonb'
    })
    metadata: any;
    @Column({
        nullable: true,
        type: 'varchar'
    })
    requestId: string | null;
    @Column({
        nullable: true,
        type: 'varchar'
    })
    sourceIpHash: string | null;
    @CreateDateColumn()
    occurredAt: Date;
}