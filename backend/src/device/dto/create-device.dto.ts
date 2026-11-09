
import { IsEnum, IsNotEmpty, IsString, IsInt, IsDate, IsOptional } from 'class-validator';
import { DeviceStatus } from '../enum/device-status.js';

export class CreateDeviceDto {

    @IsInt()
    @IsNotEmpty()
    @IsOptional()
    workspaceId: number;

    @IsString()
    @IsNotEmpty()
    deviceName: string;

    @IsString()
    @IsNotEmpty()
    platform: string;

    @IsString()
    @IsNotEmpty()
    osVersion: string;

    @IsString()
    @IsNotEmpty()
    hostName: string;

    @IsEnum(DeviceStatus)
    @IsOptional()
    deviceStatus: DeviceStatus;

    @IsOptional()
    @IsDate()
    lastSeenAt?: Date;

    @IsOptional()
    @IsDate()
    revokedAt?: Date;
}
