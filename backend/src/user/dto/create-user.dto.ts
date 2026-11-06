import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { AccountStatus } from "../enum/account-status.js";
import { Role } from "../enum/role.js";

export class CreateUserDto{
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