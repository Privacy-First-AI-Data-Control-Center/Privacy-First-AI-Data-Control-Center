import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { Integrations } from "../../integrations/entities/integration.entity.js";

@Entity()
export class ConnectorTypes {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "varchar",
        length: 64,
        unique: true,
        nullable: false,
    })
    slug: string; 

    @Column({
        type: "varchar",
        length: 128,
        nullable: false,
    })
    displayName: string; 

    @Column({
        type: "varchar",
        length: 64,
        nullable: false,
    })
    vendor: string; 

    @Column({
        type: "varchar",
        length: 512,
        nullable: true,
    })
    documentationUrl?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    
    @OneToMany(() => Integrations, (integration) => integration.connectorType)
    integrations: Relation<Integrations>[];
}
