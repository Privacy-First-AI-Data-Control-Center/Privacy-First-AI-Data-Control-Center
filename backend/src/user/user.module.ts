import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entity/users.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Users]), EmailModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
