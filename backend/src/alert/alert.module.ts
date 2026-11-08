import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertService } from './alert.service.js';
import { AlertController } from './alert.controller.js';
import { AlertNotificationService } from './alert-notification.service.js';
import { WorkspaceRoleGuard } from './guard/workspace-role.guard.js';
import { Alerts } from './entities/alerts.entity.js';
import { AlertHistories } from './entities/alert-histories.entity.js';
import { Users } from '../user/entity/users.js';
import { Workspaces } from '../workspace/entity/workspaces.js';
import { WorkspaceMembers } from '../workspace-member/entity/workspace-members.js';
import { EmailModule } from '../email/email.module.js';


@Module({
  imports: [TypeOrmModule.forFeature([Alerts, AlertHistories, Users, Workspaces, WorkspaceMembers]), EmailModule],
  controllers: [AlertController],
  providers: [AlertService, AlertNotificationService, WorkspaceRoleGuard],
  exports: [AlertService]
})
export class AlertModule {}