import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { In, LessThan, Repository } from 'typeorm';
import { RetentionSettings } from './entities/retention-settings.entity.js';
import { RetentionEntityType } from './enum/retention-entity-type.js';
import { Alerts } from '../alert/entities/alerts.entity.js';
import { Events } from '../events/entities/event.entity.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { ActorType } from '../audit-logs/enum/actor-type.js';

@Injectable()
export class RetentionJobService {
    constructor(
        @InjectRepository(RetentionSettings) private retentionRepo: Repository<RetentionSettings>,
        @InjectRepository(Alerts) private alertRepo: Repository<Alerts>,
        @InjectRepository(Events) private eventRepo: Repository<Events>,
        private auditLogsService: AuditLogsService
    ){}


    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async runForAllWorkspaces(){
        const settings = await this.retentionRepo.find({
            where:{
                enabled: true
            }
        });

        for(const setting of settings){
            await this.applySetting(setting);
        }
    }

    
    async runForWorkspace(workspaceId: number){
        const settings = await this.retentionRepo.find({
            where:{
                workspaceId: workspaceId,
                enabled: true
            }
        });

        const results: { entityType: string; deleted: number | null }[] = [];
        for(const setting of settings){
            const deleted = await this.applySetting(setting);
            results.push({ entityType: setting.entityType, deleted: deleted });
        }
        return results;
    }

   
    private async applySetting(setting: RetentionSettings): Promise<number | null>{
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - setting.retentionDays);

        let deleted: number | null = null;

        if(setting.entityType == RetentionEntityType.ALERT){
            const oldAlerts = await this.alertRepo.find({
                where:{
                    workspaceId: setting.workspaceId,
                    createdAt: LessThan(cutoffDate)
                },
                select:{
                    id: true
                }
            });
            deleted = 0;
            if(oldAlerts.length > 0){
                const ids = oldAlerts.map((alert) => alert.id);
                deleted = (await this.alertRepo.delete({ id: In(ids) })).affected ?? 0;
            }
        }
        else if(setting.entityType == RetentionEntityType.EVENT){
            const oldEvents = await this.eventRepo.find({
                where:{
                    workspace:{
                        id: setting.workspaceId
                    },
                    occurredAt: LessThan(cutoffDate)
                },
                select:{
                    id: true
                }
            });
            deleted = 0;
            if(oldEvents.length > 0){
                const ids = oldEvents.map((event) => event.id);
                deleted = (await this.eventRepo.delete({ id: In(ids) })).affected ?? 0;
            }
        }
        else{
           
            return null;
        }

       
        if(deleted > 0){
            await this.auditLogsService.log({
                workspaceId: setting.workspaceId,
                actorType: ActorType.SYSTEM,
                action: 'RETENTION_EXECUTED',
                targetType: 'RETENTION_SETTING',
                targetId: setting.id,
                metadata: {
                    entityType: setting.entityType,
                    retentionDays: setting.retentionDays,
                    cutoffDate: cutoffDate,
                    deleted: deleted
                }
            });
        }

        return deleted;
    }
}