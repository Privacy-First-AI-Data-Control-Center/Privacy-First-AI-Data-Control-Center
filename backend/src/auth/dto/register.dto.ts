import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "../../user/enum/role.js";
import { AccountStatus } from "../../user/enum/account-status.js";

export class RegisterDto{
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;
    @IsNotEmpty()
    @IsString()
    username: string;
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    passwordHash: string;
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    displayName: string;
    @IsNotEmpty()
    @IsEnum(Role)
    role: Role
    @IsOptional()
    @IsEnum(AccountStatus)
    accountStatus: AccountStatus;
    @IsOptional()
    @IsDate()
    emailVerifiedAt: Date;
    @IsOptional()
    @IsDate()
    lastLoginAt: Date;
}