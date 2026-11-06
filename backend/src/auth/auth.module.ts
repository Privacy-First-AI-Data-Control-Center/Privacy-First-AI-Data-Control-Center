import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UserService } from '../user/user.service.js';
import { UserModule } from '../user/user.module.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [UserModule, JwtModule.register({
    global: true,
    secret: 'ghosthunters',
    signOptions:{
      expiresIn: '1H'
    }
  })],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
