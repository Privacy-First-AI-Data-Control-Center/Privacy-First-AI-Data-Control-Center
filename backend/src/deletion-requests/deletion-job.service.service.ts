import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between, In, LessThan, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { DeletionRequests } from './entities/deletion-requests.entity.js';
import { DeletionStatus } from './enum/deletion-status.js';
import { Events } from '../events/entities/event.entity.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { ActorType } from '../audit-logs/enum/actor-type.js';

@Injectable()
export class DeletionJobService {
    constructor(
        @InjectRepository(DeletionRequests) private deletionRepo: Repository<DeletionRequests>,
        @InjectRepository(Events) private eventRepo: Repository<Events>,
        private auditLogsService: AuditLogsService
    ){}

    
    @Cron(CronExpression.EVERY_MINUTE)
    async processPendingRequests(){
       
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const requests = await this.deletionRepo.find({
            where:{
                status: DeletionStatus.PENDING,
                requestedAt: LessThan(oneMinuteAgo)
            }
        });

        for(const request of requests){
            await this.processRequest(request);
        }
    }

    private async processRequest(request: DeletionRequests){
       
        request.status = DeletionStatus.RUNNING;
        await this.deletionRepo.save(request);

       
        const scope = request.scope;
        const where: any = {
            workspace:{
                id: request.workspaceId
            }
        };
        if(scope.eventTypeCode){
            where.eventType = { code: scope.eventTypeCode };
        }
        if(scope.from && scope.to){
            where.occurredAt = Between(new Date(scope.from), new Date(scope.to));
        }
        else if(scope.from){
            where.occurredAt = MoreThanOrEqual(new Date(scope.from));
        }
        else if(scope.to){
            where.occurredAt = LessThanOrEqual(new Date(scope.to));
        }

        try{
           
            const events = await this.eventRepo.find({
                where: where,
                select:{
                    id: true
                }
            });

            let deleted = 0;
            if(events.length > 0){
                const ids = events.map((event) => event.id);
                const res = await this.eventRepo.delete({ id: In(ids) });
                deleted = res.affected ?? 0;
            }

           
            const remaining = await this.eventRepo.count({ where: where });

           
            request.verification = {
                deleted: deleted,
                remaining: remaining,
                verifiedAt: new Date()
            };
            request.completedAt = new Date();

            if(remaining == 0){
                request.status = DeletionStatus.COMPLETED;
            }
            else{
                request.status = DeletionStatus.FAILED;
                request.errorCode = 'VERIFICATION_FAILED';
            }
            await this.deletionRepo.save(request);
        }
        catch(err){
           
            request.status = DeletionStatus.FAILED;
            request.errorCode = 'DELETE_ERROR';
            request.completedAt = new Date();
            await this.deletionRepo.save(request);
        }

      
        await this.auditLogsService.log({
            workspaceId: request.workspaceId,
            actorType: ActorType.SYSTEM,
            action: request.status == DeletionStatus.COMPLETED ? 'DELETION_COMPLETED' : 'DELETION_FAILED',
            targetType: 'DELETION_REQUEST',
            targetId: request.id,
            metadata: request.verification
        });
    }
}