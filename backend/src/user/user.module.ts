import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entity/users.js';
import { EmailModule } from '../email/email.module.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Users]), EmailModule, WorkspaceModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
