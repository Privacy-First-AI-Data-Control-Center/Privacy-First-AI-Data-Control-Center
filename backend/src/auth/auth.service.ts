import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';
import { UserService } from '../user/user.service.js';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly blacklistedTokens = new Set<string>();
  private readonly userLogoutAllTimestamps = new Map<number, number>();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(login: LoginDto): Promise<any> {
    try {
      const user = await this.userService.getUserById(login.userId);
      if (user != null) {
        if (await bcrypt.compare(login.password, user.passwordHash)) {
          const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          };

          const accessToken = this.jwtService.sign(payload);
          const refreshToken = this.jwtService.sign(
            { ...payload, tokenType: 'refresh' },
            { expiresIn: '7d' },
          );

          return {
            accessToken,
            refreshToken,
          };
        } else {
          return 'Incorrect Password';
        }
      } else {
        return `User with id ${login.userId} not found`;
      }
    } catch {
      throw new BadRequestException('Something went wrong');
    }
  }

  async registration(registerDto: RegisterDto): Promise<string> {
    registerDto.passwordHash = await bcrypt.hash(registerDto.passwordHash, 10);
    return await this.userService.createUser({ ...registerDto });
  }

  async refreshToken(token?: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!token) {
      throw new BadRequestException('Refresh token is required');
    }

    if (this.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    try {
      const decoded = this.jwtService.verify(token);

      if (this.isTokenBlacklisted(token, decoded.id, decoded.iat)) {
        throw new UnauthorizedException('Session has been terminated');
      }

      const user = await this.userService.getProfile(decoded.id.toString());
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(payload);
      const newRefreshToken = this.jwtService.sign(
        { ...payload, tokenType: 'refresh' },
        { expiresIn: '7d' },
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: number, token?: string): Promise<{ success: boolean; message: string }> {
    if (token) {
      this.blacklistedTokens.add(token);
    }
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  async logoutAll(userId: number, token?: string): Promise<{ success: boolean; message: string }> {
    if (token) {
      this.blacklistedTokens.add(token);
    }
    this.userLogoutAllTimestamps.set(userId, Date.now());
    return {
      success: true,
      message: 'All active sessions for this user have been terminated',
    };
  }

  isTokenBlacklisted(token: string, userId?: number, tokenIssuedAtSeconds?: number): boolean {
    if (this.blacklistedTokens.has(token)) {
      return true;
    }
    if (userId && tokenIssuedAtSeconds && this.userLogoutAllTimestamps.has(userId)) {
      const logoutAllTime = this.userLogoutAllTimestamps.get(userId)!;
      if (tokenIssuedAtSeconds * 1000 < logoutAllTime) {
        return true;
      }
    }
    return false;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    if (!dto.token || !dto.newPassword) {
      throw new BadRequestException('Token and new password are required');
    }

    if (this.isTokenBlacklisted(dto.token)) {
      throw new UnauthorizedException('Reset token has already been used or revoked');
    }

    try {
      const decoded = this.jwtService.verify(dto.token);

      if (decoded.type !== 'password-reset') {
        throw new BadRequestException('Invalid token type for password reset');
      }

      const user = await this.userService.getProfile(decoded.id.toString());
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const newHash = await bcrypt.hash(dto.newPassword, 10);
      await this.userService.updatePasswordHash(user.id, newHash);

      // Invalidate used reset token
      this.blacklistedTokens.add(dto.token);

      // Terminate all sessions for security
      await this.logoutAll(user.id);

      return {
        success: true,
        message: 'Password has been reset successfully',
      };
    } catch (err: any) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired password reset token');
    }
  }
}
