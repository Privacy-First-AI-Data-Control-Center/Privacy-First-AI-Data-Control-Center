import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeletionRequests } from './entities/deletion-requests.entity.js';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Events } from '../events/entities/event.entity.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { CreateDeletionRequestDto } from './dto/create-deletion-request.dto.js';
import { DeletionStatus } from './enum/deletion-status.js';

@Injectable()
export class DeletionRequestsService {

    constructor(@InjectRepository(DeletionRequests) private readonly deletionRepo:Repository<DeletionRequests>,
                 @InjectRepository(Events)private readonly eventRepo:Repository<Events> ,private readonly auditService:AuditLogsService)
    {

    }

    async createRequest(workspaceId:number,dto:CreateDeletionRequestDto,userId:number)
    {
        if(dto.from && dto.to && dto.from>dto.to)
        {
            throw new BadRequestException('"from" must be before "to"')
        }

        const where:any={workspace:{id:workspaceId}};

        if(dto.eventTypeCode)
        {
            where.eventType={code:dto.eventTypeCode}
        }

        if(dto.from && dto.to)
        {
            where.occurredAt= Between(dto.from,dto.to)
        }

        else if(dto.from)
        {
            where.occurredAt=MoreThanOrEqual(dto.from)
        }
        else if(dto.to)
        {
            where.occurredAt=LessThanOrEqual(dto.to)
        }

        const recordsToDelete = await this.eventRepo.count({ where: where });

        const scope={from:dto.from??null, to:dto.to??null,eventTypeCode:dto.eventTypeCode??null}

        const request= await this.deletionRepo.create(
            {
                workspaceId:workspaceId,
                requestedBy:userId,
                scope:scope,
                status:DeletionStatus.PENDING
            }
        );

        const saved= await this.deletionRepo.save(request);

        await this.auditService.log(
        {
            workspaceId: workspaceId,
            actorUserId: userId,
            action: 'DELETION_REQUESTED',
            targetType: 'DELETION_REQUEST',
            targetId: saved.id,
            metadata: { scope: scope, recordsToDelete: recordsToDelete }
        })

        return{
            ...saved,
            recordsToDelete: recordsToDelete
        }


    }

    async getAllRequest(workspaceId:number)
    {
        const results= await this.deletionRepo.find({where:{workspaceId:workspaceId}, order:{requestedAt:'DESC'}})

        return results;
            
    }

    async getRequestById(workspaceId:number, requestId:number)
    {
        const results = await this.deletionRepo.findOne({where:{id:requestId,workspaceId:workspaceId}})

        if(results==null)
        {
            throw new NotFoundException(`Deletion request with id ${requestId} not found`)
        }

        return results;
    }
    
    async cancelRequest(workspaceId:number,requestId:number,userId:number)
    {
        const request = await this.getRequestById(workspaceId, requestId);

        if(request.status != DeletionStatus.PENDING)
        {
            throw new ConflictException(`Cannot cancel a request with status ${request.status}`);
        }

        const res= await this.deletionRepo.update(
            { id:requestId, status:DeletionStatus.PENDING},
            { status: DeletionStatus.CANCELLED, completedAt: new Date()}
        )

        if(res.affected==null || res.affected==0)
        {
            throw new ConflictException('Request is already being processed')
        }

        await this.auditService.log(
            {
                workspaceId: workspaceId,
                actorUserId: userId,
                action: 'DELETION_CANCELLED',
                targetType: 'DELETION_REQUEST',
                targetId: request.id
            }
        )

        return 'Deletion request cancelled successfully';
    }

    async getVerification(workspaceId:number, requestId:number)
    {
        const res=  await this.getRequestById(workspaceId,requestId);
        if(res.status != DeletionStatus.COMPLETED && res.status != DeletionStatus.FAILED)
        {
             throw new BadRequestException(`Deletion request is ${res.status}, verification not available yet`);
        }
         
        return res;
    }

}
