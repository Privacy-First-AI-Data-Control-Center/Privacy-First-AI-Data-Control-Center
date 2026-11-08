import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from 'typeorm';
import { Users } from "../../user/entity/users.js";
import { Workspaces } from "../../workspace/entity/workspaces.js";
import { AlertType } from "../enum/alert-type.js";
import { AlertSeverity } from "../enum/alert-severity.js";
import { AlertStatus } from "../enum/alert-status.js";
import { AlertHistories } from "./alert-histories.entity.js";

@Entity()
@Index(['workspaceId', 'status', 'createdAt'])
@Index(['workspaceId', 'severity'])
export class Alerts{
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

   
    @Column({
        nullable: true,
        type: 'int'
    })
    riskFindingId: number | null;

    @ManyToOne(() => Users, {
        nullable: true,
        onDelete: 'SET NULL'
    })
    @JoinColumn({ name: 'assignedUserId' })
    assignedUser: Relation<Users> | null;
    @Column({
        nullable: true,
        type: 'int'
    })
    assignedUserId: number | null;

    @Column({
        nullable: false,
        type: 'enum',
        enum: AlertType
    })
    alertType: AlertType;
    @Column({
        nullable: false,
        type: 'varchar'
    })
    title: string;
    @Column({
        nullable: false,
        type: 'enum',
        enum: AlertSeverity
    })
    severity: AlertSeverity;
    @Column({
        nullable: false,
        type: 'enum',
        enum: AlertStatus,
        default: AlertStatus.OPEN
    })
    status: AlertStatus;
    @Column({
        nullable: true,
        type: 'timestamp'
    })
    resolvedAt: Date | null;
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;

  
    @OneToMany(() => AlertHistories, (history) => history.alert)
    histories: Relation<AlertHistories>[];
}