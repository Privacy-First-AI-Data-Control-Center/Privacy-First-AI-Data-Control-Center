import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from 'typeorm';
import { Users } from "../../user/entity/users.js";
import { AlertHistoryKind } from "../enum/alert-history-kind.js";
import { Alerts } from "./alerts.entity.js";

@Entity()
export class AlertHistories{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Alerts, (alert) => alert.histories, {
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'alertId' })
    alert: Relation<Alerts>;
    @Column({
        nullable: false,
        type: 'int'
    })
    alertId: number;

   
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
        enum: AlertHistoryKind
    })
    eventKind: AlertHistoryKind;
    @Column({
        nullable: true,
        type: 'varchar'
    })
    note: string | null;
    @CreateDateColumn()
    createdAt: Date;
}