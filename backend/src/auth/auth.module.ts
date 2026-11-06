import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UserService } from '../user/user.service.js';
import { UserModule } from '../user/user.module.js';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwtStrategy.strategy.js';
import { JwtGuard } from './jwtGuard.guard.js';
import { RolesGuard } from './roles/roles.guard.js';

@Module({
  imports: [UserModule, JwtModule.register({
    global: true,
    secret: 'ghosthunters',
    signOptions:{
      expiresIn: '1H'
    }
  })],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtGuard, RolesGuard],
})
export class AuthModule {}
