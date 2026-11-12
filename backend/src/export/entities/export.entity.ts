import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Workspaces } from "../../workspace/entity/workspaces.js";
import { Users } from "../../user/entity/users.js";
import { ExportFormat } from "../enum/export-type.js";
import { ExportStatus } from "../enum/export-status.js";

@Entity('export_jobs')
@Index(['workspaceId', 'requestedAt'])
export class ExportJobs{
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
        type: 'enum',
        enum: ExportFormat
    })
    format: ExportFormat;

    @Column({
        nullable: false,
        type: 'jsonb'
    })
    filters: any;

    @Column({
        nullable: false,
        type: 'enum',
        enum: ExportStatus,
        default: ExportStatus.PENDING
    })
    status: ExportStatus;

    @Column({
        nullable: true,
        type: 'varchar'
    })
    fileReference: string | null;

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

    @Column({
        nullable: true,
        type: 'timestamp'
    })
    expiresAt: Date | null;
}