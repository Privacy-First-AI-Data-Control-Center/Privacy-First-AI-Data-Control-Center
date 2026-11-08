import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service.js';
import { Users } from '../user/entity/users.js';
import { Workspaces } from '../workspace/entity/workspaces.js';
import { WorkspaceMembers } from '../workspace-member/entity/workspace-members.js';
import { Alerts } from './entities/alerts.entity.js';
import { AlertSeverity } from './enum/alert-severity.js';

@Injectable()
export class AlertNotificationService {
    private readonly logger = new Logger(AlertNotificationService.name);

    constructor(
        private emailService: EmailService,
        @InjectRepository(Users) private userRepo: Repository<Users>,
        @InjectRepository(Workspaces) private workspaceRepo: Repository<Workspaces>,
        @InjectRepository(WorkspaceMembers) private memberRepo: Repository<WorkspaceMembers>
    ){}

    
    async notifyCreated(alert: Alerts): Promise<void>
    {
        if(alert.severity!=AlertSeverity.HIGH && alert.severity!=AlertSeverity.CRITICAL)
        {
            return;
        }

       

        const workspace = await this.workspaceRepo.findOne({
        where:{
            id: alert.workspaceId
        },
        relations:{
            ownerUser: true
        }
        });
        
         
         if(workspace==null)
         {
            return;
         }

         const owner = workspace.ownerUser;
         await this.send(owner.email, `[${alert.severity}] New alert: ${alert.title}`, this.template(owner.displayName, 'A new high-priority alert has been raised in your workspace.', alert));


    }
       
   
    async notifyAssigned(alert: Alerts, actorUserId: number): Promise<void>{
        if(alert.assignedUserId === null || alert.assignedUserId === actorUserId){
            return;
        }
        const user = await this.userRepo.findOne({ where: { id: alert.assignedUserId } });
        if(!user) return;

        await this.send(
            user.email,
            `Alert assigned to you: ${alert.title}`,
            this.template(user.displayName, 'An alert has been assigned to you.', alert)
        );
    }

   
    async notifyStatusChanged(alert: Alerts, actorUserId: number): Promise<void>{
        if(alert.assignedUserId === null || alert.assignedUserId === actorUserId){
            return;
        }
        const user = await this.userRepo.findOne({ where: { id: alert.assignedUserId } });
        if(!user) return;

        await this.send(
            user.email,
            `Alert ${alert.status.toLowerCase()}: ${alert.title}`,
            this.template(user.displayName, `An alert assigned to you is now <b>${alert.status}</b>.`, alert)
        );
    }

   
    private async send(to: string, subject: string, body: string): Promise<void>
    {
        try{
           
            await this.emailService.sendMail(to, subject.replace(/[\r\n]+/g, ' '), body);
        }
        catch(err){
            this.logger.error(`Failed to send alert email to ${to}: ${(err as Error).message}`);
        }
    }

   private template(name: string, message: string, alert: Alerts): string
   {
        return `Hi ${name},

        ${message}

        Title: ${alert.title}
        Type: ${alert.alertType}
        Severity: ${alert.severity}
        Status: ${alert.status}
        Created: ${new Date(alert.createdAt).toLocaleString()}

        Workspace ID: ${alert.workspaceId} | Alert ID: ${alert.id}

        - Privacy-First AI Data Control Center`;
   }
}