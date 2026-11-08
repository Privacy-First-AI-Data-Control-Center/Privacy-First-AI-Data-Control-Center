import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Alerts } from './entities/alerts.entity.js';
import { AlertHistories } from './entities/alert-histories.entity.js';
import { Workspaces } from '../workspace/entity/workspaces.js';
import { WorkspaceMembers } from '../workspace-member/entity/workspace-members.js';
import { Role } from '../user/enum/role.js';
import { AlertStatus } from './enum/alert-status.js';
import { AlertHistoryKind } from './enum/alert-history-kind.js';
import { CreateAlertDto } from './dto/create-alert.dto.js';
import { UpdateAlertDto } from './dto/update-alert.dto.js';
import { AssignAlertDto } from './dto/assign-alert.dto.js';
import { AlertNotificationService } from './alert-notification.service.js';
import { AlertSeverity } from './enum/alert-severity.js';

@Injectable()
export class AlertService {
    constructor(
        @InjectRepository(Alerts) private alertRepo: Repository<Alerts>,
        @InjectRepository(AlertHistories) private historyRepo: Repository<AlertHistories>,
        @InjectRepository(Workspaces) private workspaceRepo: Repository<Workspaces>,
        @InjectRepository(WorkspaceMembers) private memberRepo: Repository<WorkspaceMembers>,
        private dataSource: DataSource,
        private notificationService: AlertNotificationService
    ){}

    private async addHistory(alertId: number, eventKind: AlertHistoryKind, actorUserId: number | null, note: string | null = null)
   {
    
      await this.historyRepo.save({ alertId, actorUserId, eventKind, note });

   }

    async createAlert(workspaceId: number, createAlertDto: CreateAlertDto, actorUserId: number | null = null): Promise<Alerts>{
       
          const alert= await this.alertRepo.create({...createAlertDto,riskFindingId:createAlertDto.riskFindingId ??null,
            workspaceId:workspaceId,status: AlertStatus.OPEN
          });

          const saved= await this.alertRepo.save(alert);
          await this.addHistory(alert.id,AlertHistoryKind.CREATED,actorUserId)

          this.notificationService.notifyCreated(saved);
          return saved;
    }

   async getAllAlerts(workspaceId: string, status?: string, severity?: string): Promise<Alerts[]>{
    return await this.alertRepo.find({
        where:{
            workspace:{
                id: parseInt(workspaceId)
            },
            ...(status ? { status: status as AlertStatus } : {}),
            ...(severity ? { severity: severity as AlertSeverity } : {})
        },
        relations:{
            assignedUser: true
        },
        select:{
            id: true,
            alertType: true,
            title: true,
            severity: true,
            status: true,
            assignedUserId: true,
            resolvedAt: true,
            createdAt: true,
            assignedUser:{
                id: true,
                username: true,
                displayName: true
            }
        },
        order:{
            createdAt: 'DESC'
        }
    });
}
    async getAlertById(workspaceId: number, alertId: number): Promise<Alerts>{
       
        const alert = await this.alertRepo.findOne({
            where: { id: alertId, workspaceId: workspaceId },
            relations: { assignedUser: true },
            select: {
                assignedUser: { id: true, username: true, displayName: true, email: true }
            }
        });
        if(!alert){
            throw new NotFoundException(`Alert with id ${alertId} not found`);
        }
        return alert;
    }

   async updateAlert(workspaceId: number, alertId: number, updateAlertDto: UpdateAlertDto, actorUserId: number): Promise<string>
   {
      const alert = await this.getAlertById(workspaceId, alertId);
      if(alert != null){
        const res = (await this.alertRepo.update({ id: alert.id }, updateAlertDto)).affected;
        if(res != null && res > 0){
            await this.addHistory(alert.id, AlertHistoryKind.UPDATED, actorUserId, 'Alert updated');
            return 'Alert updated successfully';
        }
        else{
            return 'Failed to update alert';
        }
    }
    else{
        throw new NotFoundException(`Alert with id ${alertId} not found`);
    }
   }

  async acknowledgeAlert(workspaceId: number, alertId: number, actorUserId: number, note?: string): Promise<string>
  {
     const alert = await this.getAlertById(workspaceId, alertId);

   
     if(alert.status !== AlertStatus.OPEN)
     {
        throw new ConflictException(`Cannot acknowledge alert with status ${alert.status}`);
     }

    alert.status = AlertStatus.ACKNOWLEDGED;
    await this.alertRepo.save(alert);
    await this.addHistory(alert.id, AlertHistoryKind.ACKNOWLEDGED, actorUserId, note);

    return 'Alert acknowledged successfully';
 }

async resolveAlert(workspaceId: number, alertId: number, actorUserId: number, note?: string): Promise<string>{
    const alert = await this.getAlertById(workspaceId, alertId);

   
    if(alert.status === AlertStatus.RESOLVED){
        throw new ConflictException('Alert is already resolved');
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    await this.alertRepo.save(alert);
    await this.addHistory(alert.id, AlertHistoryKind.RESOLVED, actorUserId, note);

    this.notificationService.notifyStatusChanged(alert, actorUserId);
    return 'Alert resolved successfully';
}

async reopenAlert(workspaceId: number, alertId: number, actorUserId: number, note?: string): Promise<string>{
    const alert = await this.getAlertById(workspaceId, alertId);

 
    if(alert.status !== AlertStatus.RESOLVED){
        throw new ConflictException('Only resolved alerts can be reopened');
    }

    alert.status = AlertStatus.OPEN;
    alert.resolvedAt = null;
    await this.alertRepo.save(alert);
    await this.addHistory(alert.id, AlertHistoryKind.REOPENED, actorUserId, note);

    this.notificationService.notifyStatusChanged(alert, actorUserId);
    return 'Alert reopened successfully';
}

async assignAlert(workspaceId: number, alertId: number, assignAlertDto: AssignAlertDto, actorUserId: number): Promise<string>
{
   const alert=  await this.getAlertById(workspaceId,alertId)
   const assignId= assignAlertDto.assignedUserId

   if(assignId!=null)
   {
      const member= await this.memberRepo.findOne(
        {where:{workspace:{id:workspaceId},
             user:{id:assignId}}})

       if(member==null)
       {
        throw new BadRequestException(`User ${assignId} is not a member of this workspace`)
       }
       if(member.role == Role.VIEWER)  
       {
          throw new BadRequestException('Alert cannot be assigned to a VIEWER');
       }

   }

    alert.assignedUserId = assignId;
    await this.alertRepo.save(alert);

    let note='Unassigned'
    if(assignId!=null)
    {
        note=`Assigned to user ${assignId}`
    }
    
    await this.addHistory(alert.id, AlertHistoryKind.ASSIGNED, actorUserId, note);

     this.notificationService.notifyAssigned(alert,actorUserId)

     if(assignId!=null)
     {
        return `Alert assigned to user ${assignId} successfully`;
     }

     else{
        return 'Alert unassigned successfully';
    }
}
     


async getAlertHistory(workspaceId: number, alertId: number): Promise<AlertHistories[]>{
        await this.getAlertById(workspaceId, alertId);
        return await this.historyRepo.find({
            where: { alertId: alertId },
            relations: { actorUser: true },
            select: {
                actorUser: { id: true, username: true, displayName: true }
            },
            order: { createdAt: 'ASC' }
        });
    }

 async getStatistics(workspaceId: number, from?: Date, to?: Date)
 {
        const base = () => {
         const qb = this.alertRepo.createQueryBuilder('alert')
                .where('alert.workspaceId = :workspaceId', { workspaceId });
            if(from) qb.andWhere('alert.createdAt >= :from', { from });
            if(to) qb.andWhere('alert.createdAt <= :to', { to });
            return qb;
        };

        const byStatus = await base()
            .select('alert.status', 'status')
            .addSelect('COUNT(*)::int', 'count')
            .groupBy('alert.status')
            .getRawMany();

        const bySeverity = await base()
            .select('alert.severity', 'severity')
            .addSelect('COUNT(*)::int', 'count')
            .groupBy('alert.severity')
            .getRawMany();

        const byType = await base()
            .select('alert.alertType', 'alertType')
            .addSelect('COUNT(*)::int', 'count')
            .groupBy('alert.alertType')
            .getRawMany();

        const daily = await base()
            .select(`TO_CHAR(DATE_TRUNC('day', alert.createdAt), 'YYYY-MM-DD')`, 'date')
            .addSelect('COUNT(*)::int', 'count')
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();

    
        const mttr = await base()
            .select('AVG(EXTRACT(EPOCH FROM (alert.resolvedAt - alert.createdAt)) / 60)', 'minutes')
            .andWhere('alert.resolvedAt IS NOT NULL')
            .getRawOne();

        const total = byStatus.reduce((sum, row) => sum + row.count, 0);
        const openCount = byStatus.find((row) => row.status === AlertStatus.OPEN)?.count ?? 0;

        return {
            total,
            open: openCount,
            byStatus,
            bySeverity,
            byType,
            daily,
            meanTimeToResolveMinutes: mttr?.minutes != null ? Math.round(Number(mttr.minutes)) : null
        };
    }

   

 
   
   
   

}