import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './user/user.module.js';
import { ConfigModule} from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { EmailModule } from './email/email.module.js';
import { WorkspaceModule } from './workspace/workspace.module.js';
import { WorkspaceMemberModule } from './workspace-member/workspace-member.module.js';

import { AlertModule } from './alert/alert.module.js';
import { AuditLogsModule } from './audit-logs/audit-logs.module.js';
import { ConnectorsModule } from './connectors/connectors.module.js';
import { EventsModule } from './events/events.module.js';
import { IntegrationsModule } from './integrations/integrations.module.js';
import { RetentionModule } from './retention/retention.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { DeviceModule } from './device/device.module.js';
import { AgentModule } from './agent/agent.module.js';
import { SensitiveDataTypeModule } from './sensitive-data-type/sensitive-data-type.module.js';
import { FindingModule } from './finding/finding.module.js';
import { HealthModule } from './health/health.module.js';
import { PolicyModule } from './policy/policy.module.js';
import { DeletionRequestsModule } from './deletion-requests/deletion-requests.module.js';
import { PolicyDecisionModule } from './policy-decision/policy-decision.module.js';
import { ExportModule } from './export/export.module.js';
import { EnforcementActionModule } from './enforcement-action/enforcement-action.module.js';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env'
  }), TypeOrmModule.forRoot({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    autoLoadEntities: true,
    synchronize: true
  }), ScheduleModule.forRoot(), UserModule, AuthModule, EmailModule, WorkspaceModule, WorkspaceMemberModule, AlertModule, AuditLogsModule, ConnectorsModule, EventsModule, IntegrationsModule, RetentionModule, DeviceModule, AgentModule, SensitiveDataTypeModule, FindingModule, HealthModule, DeletionRequestsModule, PolicyModule, ExportModule,PolicyDecisionModule, EnforcementActionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}