import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './user/user.module.js';
import { ConfigModule} from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { EmailModule } from './email/email.module.js';
import { WorkspaceModule } from './workspace/workspace.module.js';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env'
  }), TypeOrmModule.forRoot({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    autoLoadEntities: true,
    synchronize: true
  }) , UserModule, AuthModule, EmailModule, WorkspaceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
