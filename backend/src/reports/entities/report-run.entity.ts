 import {
      Column,
      CreateDateColumn,
      Entity, 
      Index, 
      JoinColumn, 
      ManyToOne, 
      PrimaryGeneratedColumn,
    } from 'typeorm';
    import type { Relation } from 'typeorm';
    import { Reports } from './report.entity.js';
    import { Users } from '../../user/entity/users.js';
    import { ReportRunStatus } from '../enum/report-run-status.enum.js';
  
    @Entity('report_runs')
    @Index(['reportId', 'createdAt']) 
    export class ReportRuns { 
      @PrimaryGeneratedColumn()
      id: number;               
  
      @ManyToOne(() => Reports, (report) => report.runs, {
        nullable: false,
        onDelete: 'CASCADE',                                                                                                                                                               
      })                                                                                                                                                                                   
      @JoinColumn({ name: 'reportId' })                                                                                                                                                    
      report: Relation<Reports>;                                                                                                                                                           
                                                                                                                                                                                           
      @Column({ type: 'int', nullable: false })                                                                                                                                            
      reportId: number;                                                                                                                                                                    
                                                                                                                                                                                           
      @ManyToOne(() => Users, { nullable: true, onDelete: 'SET NULL' })                                                                                                                    
      @JoinColumn({ name: 'requestedBy' })                                                                                                                                                 
      requestedByUser: Relation<Users> | null;                                                                                                                                             
                                                                                                                                                                                           
      @Column({ type: 'int', nullable: true })                                                                                                                                             
      requestedBy: number | null;
  
      @Column({
        type: 'enum',
        enum: ReportRunStatus,
        default: ReportRunStatus.PENDING,
      })
      status: ReportRunStatus;
  
      @Column({ type: 'varchar', length: 512, nullable: true })
      resultReference: string | null;
  
      @Column({ type: 'varchar', length: 256, nullable: true })
      errorCode: string | null;
  
      @Column({ type: 'timestamp with time zone', nullable: true })
      startedAt: Date | null;
  
      @Column({ type: 'timestamp with time zone', nullable: true })
      completedAt: Date | null;
  
      @CreateDateColumn()
      createdAt: Date;
    }
