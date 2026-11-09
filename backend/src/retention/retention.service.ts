import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RetentionSettings } from './entities/retention-settings.entity.js';
import { LessThan, Repository } from 'typeorm';
import { Alerts } from '../alert/entities/alerts.entity.js';
import { CreateRetentionDto } from './dto/create-retention.dto.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { UpdateRetentionDto } from './dto/update-retention.dto.js';
import { RetentionEntityType } from './enum/retention-entity-type.js';
import { PreviewRetentionDto } from './dto/preview-retention.dto.js';
import { Events } from '../events/entities/event.entity.js';
import { set } from 'supertest/lib/cookies.js';

@Injectable()
export class RetentionService {

    constructor(@InjectRepository(RetentionSettings) private readonly retentionRepo: Repository<RetentionSettings>,
               @InjectRepository(Alerts) private readonly alertsRepo:Repository<Alerts>,
            @InjectRepository(Events) private readonly eventRepo:Repository<Events>,
             private readonly auditService:AuditLogsService){}

            async createSetting(workspaceId:number, dto:CreateRetentionDto,userId:number):Promise<RetentionSettings>
            {
                const exist= await this.retentionRepo.findOne(
                    {
                        where:{workspaceId:workspaceId,entityType:dto.entityType}
                    }
                )


                if(exist)
                {
                    throw new ConflictException(`Retention setting for ${dto.entityType} already exists`);
                }

                const setting = this.retentionRepo.create({
                   workspaceId: workspaceId, entityType: dto.entityType,retentionDays: dto.retentionDays,
                      enabled: dto.enabled ?? true,updatedBy: userId
                });

                const saved=await this.retentionRepo.save(setting);

                await this.auditService.log({ workspaceId: workspaceId, actorUserId: userId,
                  action: 'RETENTION_CREATED', targetType: 'RETENTION_SETTING',targetId: saved.id,
                      metadata: { entityType: saved.entityType, retentionDays: saved.retentionDays, enabled: saved.enabled }
                       });

                   return saved;
            }


            async getAllSettings(workspaceId:number):Promise<RetentionSettings[]>
            {
                return await this.retentionRepo.find({
                     where:{
                           workspaceId: workspaceId
                          }, order:{entityType: 'ASC'}
                       });
            }

            async getSettingsById(workspaceId:number, settingsId:number):Promise<RetentionSettings>
            {
                  const setting=  await this.retentionRepo.findOne(
                    {
                        where:{id:settingsId,workspaceId:workspaceId}
                    }
                  );

                  if(!setting)
                  {
                    throw new NotFoundException(`Retention setting with id ${settingsId} not found`);
                  }

                  return setting;
            }

            async updateSetting(workspaceId:number,settingsId:number,dto:UpdateRetentionDto,userId:number):Promise<string>
            {
               if(dto.retentionDays==null && dto.enabled==null)
               {
                throw new BadRequestException("Nothing to update")
               }

               const setting= await this.getSettingsById(workspaceId,settingsId)

               const before= {retentionDays:setting.retentionDays, enable:setting.enabled};
               if(dto.retentionDays!=null)
               {
                 setting.retentionDays=dto.retentionDays;
               }

               if(dto.enabled!=null)
               {
                setting.enabled=dto.enabled;
               }

               setting.updatedBy=userId
               await this.retentionRepo.save(setting);

               await this.auditService.log({
                 workspaceId: workspaceId,
                  actorUserId: userId,
                    action: 'RETENTION_UPDATED',
                    targetType: 'RETENTION_SETTING',
                      targetId: setting.id,
                         metadata: {
                         entityType: setting.entityType,
                        before: before,
                        after: { retentionDays: setting.retentionDays, enabled: setting.enabled }
                    }
                       });

                 return 'Retention setting updated successfully';
            }

            async deleteSetting(workspaceId: number, settingId: number, userId: number): Promise<string>
            {
                  const setting = await this.getSettingsById(workspaceId, settingId);
                  await this.retentionRepo.delete({ id: setting.id });

                   await this.auditService.log({
                     workspaceId: workspaceId,
                     actorUserId: userId,
                    action: 'RETENTION_DELETED',
                   targetType: 'RETENTION_SETTING',
                    targetId: setting.id,
                       metadata: { entityType: setting.entityType, retentionDays: setting.retentionDays }
                         });

                       return 'Retention setting deleted successfully';
            }

            async preview(workspaceId: number, previewRetentionDto: PreviewRetentionDto)
            {

                 const cutoffDate = new Date();
                 cutoffDate.setDate(cutoffDate.getDate() - previewRetentionDto.retentionDays);

                 let recordsToDelete: number | null = null;
                 let note = '';

                 if(previewRetentionDto.entityType == RetentionEntityType.ALERT)
                 {
                   recordsToDelete = await this.alertsRepo.count({
                   where:{
                    workspaceId: workspaceId,
                    createdAt: LessThan(cutoffDate)
                    }
                   });
                 }
                else if(previewRetentionDto.entityType == RetentionEntityType.EVENT)
                {
                   recordsToDelete = await this.eventRepo.count({
                    where:{
                    workspace:{
                        id: workspaceId
                    },
                    occurredAt: LessThan(cutoffDate)
                    }
                  });
                }

                else{
                 
                 note = `Preview for ${previewRetentionDto.entityType} is not available yet`;
                 }

                 return {
                 entityType: previewRetentionDto.entityType,
                retentionDays: previewRetentionDto.retentionDays,
                cutoffDate: cutoffDate,
                  recordsToDelete: recordsToDelete,
                 note: note
                 };
     
        
            }


}
