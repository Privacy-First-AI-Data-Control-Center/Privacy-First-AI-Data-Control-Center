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
import { SensitiveDataTypeModule } from './sensitive-data-type/sensitive-data-type.module.js';
import { FindingModule } from './finding/finding.module.js';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env'
  }), TypeOrmModule.forRoot({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    autoLoadEntities: true,
    synchronize: true
  }) , UserModule, AuthModule, EmailModule, WorkspaceModule, WorkspaceMemberModule,AlertModule, SensitiveDataTypeModule, FindingModule],
  controllers: [AppController],
  providers: [AppService,],
})
export class AppModule {}
