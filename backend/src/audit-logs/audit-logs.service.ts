import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLogs } from './entities/audit-logs.entity.js';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateAuditLogDto } from './dto/create-audit-log.dto.js';
import { ActorType } from './enum/actor-type.js';
import { QueryAuditLogsDto } from './dto/query-audit-log.dto.js';

@Injectable()
export class AuditLogsService
{
   
    constructor(@InjectRepository(AuditLogs) private readonly auditRepo:Repository<AuditLogs>){}

    async log(createAuditLogDto:CreateAuditLogDto)
    {
        try{
            await this.auditRepo.save({
                workspaceId:createAuditLogDto.workspaceId,
                actorUser:createAuditLogDto.actorUserId ?{ id: createAuditLogDto.actorUserId } : null,
                actorType:createAuditLogDto.actorType ?? ActorType.USER,
                action:createAuditLogDto.action,
                targetType:createAuditLogDto.targetType,
                targetId:createAuditLogDto.targetId !=null ? String(createAuditLogDto.targetId):null,
                metadata:createAuditLogDto.metadata ?? null,
                requestId:createAuditLogDto.requestId ?? null,
                
            });
        }

        catch{
               throw new BadRequestException("audit logs can't saved");
        }
    }
 

    async getAllLogs(workspaceId: number, query: QueryAuditLogsDto): Promise<AuditLogs[]>
    {
       return await this.auditRepo.find({
        where:{ workspaceId: workspaceId, ...(query.action ? { action: query.action } : {}),
            ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}), ...(query.targetType ? { targetType: query.targetType } : {}),
           ...(query.from && query.to ? { occurredAt: Between(query.from, query.to) } : {}),
            ...(query.from && !query.to ? { occurredAt: MoreThanOrEqual(query.from) } : {}),
              ...(!query.from && query.to ? { occurredAt: LessThanOrEqual(query.to) } : {})
        },
        relations:{  actorUser: true },
        select:{  actorUser:{
                id: true,
                username: true,
                displayName: true
            }
        },
        order:{
            occurredAt: 'DESC'
        }
       });

  }

   async getLogById(workspaceId: number, logId: number): Promise<AuditLogs>
   {
       const log = await this.auditRepo.findOne({
            where:{
                id: logId,
                workspaceId: workspaceId
            },
            relations:{
                actorUser: true
            },
            select:{
                actorUser:{
                    id: true,
                    username: true,
                    displayName: true
                }
            }
        });

        if(log == null){
            throw new NotFoundException(`Audit log with id ${logId} not found`);
        }
        return log;
    
   }

}
