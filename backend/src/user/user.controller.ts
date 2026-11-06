import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service.js';
import { Users } from './entity/users.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  @UseGuards(JwtGuard)
  async getProfile(@Req() req:any): Promise<Users | null>{
    return await this.userService.getProfile(req.user.id);
  }
}
