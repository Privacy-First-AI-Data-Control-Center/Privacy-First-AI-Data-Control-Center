import { BadRequestException, ConflictException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExportJobs } from './entities/export.entity.js';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Events } from '../events/entities/event.entity.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { CreateExportDto } from './dto/create-export.dto.js';
import { ExportStatus } from './enum/export-status.js';
import { createReadStream, existsSync } from 'fs';
import { ExportFormat } from './enum/export-type.js';

@Injectable()
export class ExportService {

    constructor(@InjectRepository(ExportJobs) private readonly exportRepo:Repository<ExportJobs>,
            @InjectRepository(Events) private readonly eventRepo:Repository<Events>, 
        private readonly auditService:AuditLogsService){}

    
    async createExport(workspaceId:number, dto:CreateExportDto, userId:number)
    {
        if(dto.from && dto.to && dto.from>dto.to)
        {
             throw new BadRequestException('"from" must be before "to"');
        }

        const condition:any={workspace:{id:workspaceId}}

        if(dto.eventTypeCode)
        {
             condition.eventType = { code: dto.eventTypeCode };
        }
        if(dto.from && dto.to)
        {
            condition.occurredAt=Between(dto.from, dto.to);
        }

        else if(dto.from)
        {
            condition.occurredAt=MoreThanOrEqual(dto.from)
        }
        else if(dto.to)
        {
            condition.occurredAt=LessThanOrEqual(dto.to);
        }

        const total =await this.eventRepo.count({where:condition})

        const filters = {
            from: dto.from ?? null,
            to: dto.to ?? null,
            eventTypeCode: dto.eventTypeCode ?? null
        };
        const exportJob = this.exportRepo.create({
            workspaceId: workspaceId,
            requestedBy: userId,
            format: dto.format,
            filters: filters,
            status: ExportStatus.PENDING
        });

        const saved = await this.exportRepo.save(exportJob);

        await this.auditService.log({
            workspaceId: workspaceId,
            actorUserId: userId,
            action: 'EXPORT_REQUESTED',
            targetType: 'EXPORT_JOB',
            targetId: saved.id,
            metadata: { format: dto.format, filters: filters, recordsToExport: total }
        });

        return {
            ...saved,
            recordsToExport: total
        };
    }

    async getAllExports(workspaceId:number)
    {
      const exports= await this.exportRepo.find({where:{workspaceId:workspaceId}})

      return exports;
    }

    async getExportsById(workspaceId:number, exportsId:number)
    {
        const exports= await this.exportRepo.findOne({where:{workspaceId:workspaceId,id:exportsId}})
        if(exports==null)
        {
            throw new NotFoundException(`Export with id ${exportsId} not found`)
        }
        return exports
    }

    async cancelExports(workspaceId:number,exportId:number,userId:number)
    {
        const exports= await this.getExportsById(workspaceId,exportId)
        if(exports.status!=ExportStatus.PENDING)
        {
            throw new ConflictException(`Cannot cancel an export with status ${exports.status}`);
        }

        exports.status=ExportStatus.CANCELLED;
        exports.completedAt= new Date();

        await this.exportRepo.save(exports)
         await this.auditService.log({
            workspaceId: workspaceId,
            actorUserId: userId,
            action: 'EXPORT_CANCELLED',
            targetType: 'EXPORT_JOB',
            targetId: exports.id
        });

        return 'Export cancelled successfully';
    }

    async downloadExports(workspaceId:number,exportId:number,userId:number)
    {
        const exports= await this.getExportsById(workspaceId,exportId)
        if(exports.status!=ExportStatus.COMPLETED)
        {
            throw new BadRequestException(`Export is ${exports.status}, not ready for download`);
        }

        if(exports.expiresAt!=null && exports.expiresAt<new Date())
        {
            throw new BadRequestException('Export has expired, please request a new one');
        }
        if(exports.fileReference==null ||  !existsSync(exports.fileReference))
        {
             throw new NotFoundException('Export file not found');
        }

        await this.auditService.log({
            workspaceId: workspaceId,
            actorUserId: userId,
            action: 'EXPORT_DOWNLOADED',
            targetType: 'EXPORT_JOB',
            targetId: exports.id
        });

        const csv= exports.format==ExportFormat.CSV
        const fileName = `export-${exports.id}.${csv ? 'csv' : 'json'}`;

        return new StreamableFile(createReadStream(exports.fileReference), {
            type: csv ? 'text/csv' : 'application/json',
            disposition: `attachment; filename="${fileName}"`
        });
    }
}
