import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() login: LoginDto): Promise<string>{
    return await this.authService.login(login);
  }
}
