import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { Workspaces } from "../../workspace/entity/workspaces.js";
import { ConnectorTypes } from "../../connectors/entities/connector.entity.js";
import { IntegrationStatus } from "../enum/integration-status.js";

@Entity()
export class Integrations {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Workspaces, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn()
    workspace: Relation<Workspaces>;

    @ManyToOne(() => ConnectorTypes, (connectorType) => connectorType.integrations, { nullable: false })
    @JoinColumn()
    connectorType: Relation<ConnectorTypes>;

    @Column({ type: "varchar", length: 128, nullable: true })
    deviceId?: string;

    @Column({ type: "varchar", length: 128, nullable: false })
    displayName: string;

    @Column({ type: "varchar", length: 32, default: "1.0.0" })
    version: string;

    @Column({
        type: "enum",
        enum: IntegrationStatus,
        default: IntegrationStatus.ACTIVE,
    })
    status: IntegrationStatus;

    @Column({ type: "varchar", length: 256, nullable: true })
    secretReference?: string;

    @Column({ type: "timestamp with time zone", nullable: true })
    connectedAt?: Date;

    @Column({ type: "timestamp with time zone", nullable: true })
    disconnectedAt?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
