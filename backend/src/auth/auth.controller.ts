import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { JwtGuard } from './jwtGuard.guard.js';

@ApiTags('Authentication (Member 1)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Authenticate and issue access/refresh tokens' })
  @ApiResponse({ status: 200, description: 'User authenticated successfully' })
  @Post('login')
  async login(@Body() login: LoginDto): Promise<any> {
    return await this.authService.login(login);
  }

  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @Post('register')
  async registration(@Body() registerDto: RegisterDto): Promise<string> {
    return this.authService.registration(registerDto);
  }

  @ApiOperation({ summary: 'Issue a new access token using a refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: any,
  ) {
    const token =
      refreshTokenDto?.refreshToken ||
      req.headers?.authorization?.replace(/^Bearer\s+/i, '');

    return await this.authService.refreshToken(token);
  }

  @ApiOperation({ summary: 'End the current login session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: any) {
    const rawToken = req.headers?.authorization?.replace(/^Bearer\s+/i, '');
    return await this.authService.logout(req.user?.id, rawToken);
  }

  @ApiOperation({ summary: 'End all sessions belonging to the current user' })
  @ApiResponse({ status: 200, description: 'All active sessions terminated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  async logoutAll(@Req() req: any) {
    const rawToken = req.headers?.authorization?.replace(/^Bearer\s+/i, '');
    return await this.authService.logoutAll(req.user?.id, rawToken);
  }

  @ApiOperation({ summary: 'Set a new password using a valid reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token or weak password' })
  @ApiResponse({ status: 401, description: 'Invalid or expired reset token' })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}
