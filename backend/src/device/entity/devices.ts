import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from 'typeorm';
import { Workspaces } from "../../workspace/entity/workspaces.js";
import { DeviceStatus } from "../enum/device-status.js";

@Entity()
export class Devices{
    @PrimaryGeneratedColumn()
    id: number;
    @ManyToOne(()=> Workspaces, (workspace)=> workspace.devices, {
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    workspace: Relation<Workspaces>;
    @Column({
        type: 'varchar',
        nullable: false
    })
    deviceName: string;
    @Column({
        type: 'varchar',
        nullable: false
    })
    platform: string;
    @Column({
        type: 'varchar',
        nullable: false
    })
    osVersion: string;
    @Column({
        type: 'varchar',
        nullable: false
    })
    hostName: string;
    @Column({
        nullable: false,
        type: 'enum',
        enum: DeviceStatus,
        default: DeviceStatus.ACTIVE
    })
    deviceStatus: DeviceStatus;
    @Column({
        type: 'timestamp',
        nullable: false,
        default: () => 'CURRENT_TIMESTAMP'
    })
    lastSeenAt: Date;
    @Column({
        type: 'timestamp',
        nullable: false,
        default: () => 'CURRENT_TIMESTAMP'
    })
    revokedAt: Date;
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;
    @DeleteDateColumn()
    deletedAt: Date;
}