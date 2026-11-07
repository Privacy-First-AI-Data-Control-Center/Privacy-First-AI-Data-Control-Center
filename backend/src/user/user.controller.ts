import { Body, Controller, Delete, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service.js';
import { Users } from './entity/users.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  @UseGuards(JwtGuard)
  async getProfile(@Req() req:any): Promise<Users | null>{
    return await this.userService.getProfile(req.user.id);
  }

  @Patch('/me')
  @UseGuards(JwtGuard)
  async updateUser(@Req() req: any, @Body() updateUserDto: UpdateUserDto): Promise<string>{
    return await this.userService.updateUser(req.user.id, updateUserDto);
  }

  @Patch('/me/password')
  @UseGuards(JwtGuard)
  async changePassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto): Promise<string>{
    return await this.userService.changePassword(req.user.id, changePasswordDto);
  }

  @Delete('/me')
  @UseGuards(JwtGuard)
  async deleteUser(@Req() req: any): Promise<string>{
    return await this.userService.deleteUser(req.user.id);
  }
}
