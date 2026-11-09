import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from 'typeorm';
import { AgentStatus } from "../enum/agent-status.js";
import { Devices } from "../../device/entity/devices.js";

@Entity()
export class AgentInstallations{
    @PrimaryGeneratedColumn()
    id: number;
    @ManyToOne(()=> Devices, (device)=> device.agentInstallations, {
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    device: Relation<Devices>;
    @Column({
        type: 'varchar',
        nullable: false,
        unique: true
    })
    installationId: string;
    @Column({
        type: 'varchar',
        nullable: false
    })
    agentVersion: string;
    @Column({
        type: 'enum',
        nullable: false,
        enum: AgentStatus,
        default: AgentStatus.INSTALLING
    })
    agentStatus: AgentStatus;
    @CreateDateColumn()
    installedAt: Date;
    @Column({
        type: 'timestamp',
        nullable: false,
        default: () => 'CURRENT_TIMESTAMP'
    })
    lastHeartbeatAt: Date;
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;
    @DeleteDateColumn()
    deletedAt: Date;
}
