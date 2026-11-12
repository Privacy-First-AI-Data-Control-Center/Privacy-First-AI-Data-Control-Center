import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { ExportJobs } from './entities/export.entity.js';
import { ExportStatus } from './enum/export-status.js';
import { ExportFormat } from './enum/export-type.js';
import { Events } from '../events/entities/event.entity.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { ActorType } from '../audit-logs/enum/actor-type.js';

@Injectable()
export class ExportJobService {
    constructor(
        @InjectRepository(ExportJobs) private exportRepo: Repository<ExportJobs>,
        @InjectRepository(Events) private eventRepo: Repository<Events>,
        private auditLogsService: AuditLogsService
    ){}

    
    @Cron(CronExpression.EVERY_MINUTE)
    async processPendingExports(){
        const exportJobs = await this.exportRepo.find({
            where:{ status: ExportStatus.PENDING }
        });

        for(const exportJob of exportJobs){
            await this.processExport(exportJob);
        }
    }

    private async processExport(exportJob: ExportJobs){
        exportJob.status = ExportStatus.RUNNING;
        await this.exportRepo.save(exportJob);

        try{
           
            const filters = exportJob.filters;
            const condition: any = { workspace:{ id: exportJob.workspaceId } };

            if(filters.eventTypeCode){
                condition.eventType = { code: filters.eventTypeCode };
            }
            if(filters.from && filters.to){
                condition.occurredAt = Between(new Date(filters.from), new Date(filters.to));
            }
            else if(filters.from){
                condition.occurredAt = MoreThanOrEqual(new Date(filters.from));
            }
            else if(filters.to){
                condition.occurredAt = LessThanOrEqual(new Date(filters.to));
            }

           
            const events = await this.eventRepo.find({
                where: condition,
                relations:{ eventType: true, attributes: true },
                order:{ occurredAt: 'ASC' }
            });

            
            const rows = events.map((event) => {
                const attributes: any = {};
                for(const attr of event.attributes ?? []){
                    if(attr.isSensitive || attr.isRedacted){
                        attributes[attr.attributeKey] = '[REDACTED]';
                    }
                    else{
                        attributes[attr.attributeKey] = attr.stringValue ?? attr.numericValue ?? attr.booleanValue ?? attr.datetimeValue;
                    }
                }

                return {
                    id: event.id,
                    occurredAt: event.occurredAt,
                    eventType: event.eventType?.code,
                    category: event.eventType?.category,
                    deviceId: event.deviceId,
                    severity: event.severity,
                    summary: event.summary,
                    attributes: attributes
                };
            });

            
            let content = '';
            if(exportJob.format == ExportFormat.JSON){
                content = JSON.stringify(rows, null, 2);
            }
            else{
                const header = 'id,occurredAt,eventType,category,deviceId,severity,summary,attributes';
                const lines = rows.map((row) => [
                    row.id,
                    new Date(row.occurredAt).toISOString(),
                    row.eventType,
                    row.category,
                    row.deviceId,
                    row.severity,
                    row.summary,
                    JSON.stringify(row.attributes)
                ].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));

                content = [header, ...lines].join('\n');
            }

           
            const folder = join(process.cwd(), 'exports');
            await mkdir(folder, { recursive: true });

            const extension = exportJob.format == ExportFormat.CSV ? 'csv' : 'json';
            const filePath = join(folder, `export-${exportJob.id}.${extension}`);
            await writeFile(filePath, content, 'utf-8');

           
            exportJob.status = ExportStatus.COMPLETED;
            exportJob.fileReference = filePath;
            exportJob.completedAt = new Date();
            exportJob.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await this.exportRepo.save(exportJob);
        }
        catch(err){
            exportJob.status = ExportStatus.FAILED;
            exportJob.errorCode = 'EXPORT_ERROR';
            exportJob.completedAt = new Date();
            await this.exportRepo.save(exportJob);
        }

     
        await this.auditLogsService.log({
            workspaceId: exportJob.workspaceId,
            actorType: ActorType.SYSTEM,
            action: exportJob.status == ExportStatus.COMPLETED ? 'EXPORT_COMPLETED' : 'EXPORT_FAILED',
            targetType: 'EXPORT_JOB',
            targetId: exportJob.id,
            metadata: { format: exportJob.format }
        });
    }
}