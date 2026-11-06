import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service.js';
import { Users } from './entity/users.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  async getProfile(): Promise<Users | null>{
    return await this.userService.getProfile('1');
  }
}
