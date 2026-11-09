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
<<<<<<< HEAD
import { ConnectorsModule } from './connectors/connectors.module.js';
import { EventsModule } from './events/events.module.js';
import { IntegrationsModule } from './integrations/integrations.module.js';
import { RetentionModule } from './retention/retention.module.js';
import { ScheduleModule } from '@nestjs/schedule';
=======
import { DeviceModule } from './device/device.module.js';
import { AgentModule } from './agent/agent.module.js';
>>>>>>> ayan

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env'
  }), TypeOrmModule.forRoot({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    autoLoadEntities: true,
    synchronize: true
<<<<<<< HEAD
  }) , ScheduleModule.forRoot(),UserModule, AuthModule, EmailModule, WorkspaceModule, WorkspaceMemberModule,AlertModule, AuditLogsModule, ConnectorsModule, EventsModule, IntegrationsModule, RetentionModule],
=======
  }) , UserModule, AuthModule, EmailModule, WorkspaceModule, WorkspaceMemberModule,AlertModule, AuditLogsModule, DeviceModule, AgentModule],
>>>>>>> ayan
  controllers: [AppController],
  providers: [AppService,],
})
export class AppModule {}
