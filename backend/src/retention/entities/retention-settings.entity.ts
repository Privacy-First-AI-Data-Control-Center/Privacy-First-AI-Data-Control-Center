import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Workspaces } from "../../workspace/entity/workspaces.js";
import { Users } from "../../user/entity/users.js";
import { RetentionEntityType } from "../enum/retention-entity-type.js";

@Entity('retention_settings')
@Index(['workspaceId', 'entityType'], { unique: true })
export class RetentionSettings{
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
    @JoinColumn({ name: 'updatedBy' })
    updatedByUser: Relation<Users> | null;
    @Column({
        nullable: true,
        type: 'int'
    })
    updatedBy: number | null;

    @Column({
        nullable: false,
        type: 'enum',
        enum: RetentionEntityType
    })
    entityType: RetentionEntityType;
    @Column({
        nullable: false,
        type: 'int'
    })
    retentionDays: number;
    @Column({
        nullable: false,
        type: 'boolean',
        default: true
    })
    enabled: boolean;
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;
}