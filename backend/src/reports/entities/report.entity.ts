import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ReportFormat } from "../enum/report-format.enum.js";
import { ReportType } from "../enum/report-type.enum.js";
import { Workspaces } from "../../workspace/entity/workspaces.js";
import type { Relation } from "typeorm";
import { Users } from "../../user/entity/users.js";
import { ReportRuns } from "./report-run.entity.js";

 
  export interface ReportDefinition{
    reportType :ReportType ,
    format :ReportFormat,
    from ?:string ,
    to? :string ,
    sections?:string[] , 


}
@Entity('reports')
@Index(['workspaceId', 'createdAt'])
export class Reports {
    @PrimaryGeneratedColumn()
      id: number;
  
      @ManyToOne(() => Workspaces, { nullable: false, onDelete: 'CASCADE' })
      @JoinColumn({ name: 'workspaceId' })
      workspace: Relation<Workspaces>;
  
      @Column({ type: 'int', nullable: false })
      workspaceId: number;
  
      @ManyToOne(() => Users, { nullable: true, onDelete: 'SET NULL' })
      @JoinColumn({ name: 'createdBy' })
      createdByUser: Relation<Users> | null; 
  
      @Column({ type: 'int', nullable: true })
      createdBy: number | null; 
  
      @Column({ type: 'varchar', length: 160, nullable: false }) 
      title: string;
  
      @Column({ type: 'jsonb', nullable: false })
      definition: ReportDefinition  ; 
  
      @OneToMany(() => ReportRuns, (run) => run.report)
      runs: Relation<ReportRuns>[]; 
  
      @CreateDateColumn() 
      createdAt: Date;
  
      @UpdateDateColumn()
      updatedAt: Date; 
  
      @DeleteDateColumn() 
      deletedAt?: Date;


}
