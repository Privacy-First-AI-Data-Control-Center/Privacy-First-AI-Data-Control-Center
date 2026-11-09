import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DeviceService } from './device.service.js';
import { CreateDeviceDto } from './dto/create-device.dto.js';
import { Devices } from './entity/devices.js';
import { UpdateDeviceDto } from './dto/update-device.dto.js';
import { DeviceStatus } from './enum/device-status.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';

@Controller('workspaces/:workspaceId/device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

    @Post('enroll')
    @UseGuards(JwtGuard)
    async enrollDevice(@Param('workspaceId') workspaceId: string, @Body() createDeviceDto: CreateDeviceDto): Promise<string>{
      createDeviceDto.workspaceId = parseInt(workspaceId);
      return await this.deviceService.enrollDevice(createDeviceDto);
    }

    @Get()
    @UseGuards(JwtGuard)
    async getAllDevices(@Param('workspaceId') workspaceId: string): Promise<Devices[]>{
      return await this.deviceService.getAllDevices(workspaceId);
    }

    @Get('/:deviceId')
    @UseGuards(JwtGuard)
    async getDeviceDetails(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string): Promise<Devices>{
      return await this.deviceService.getDeviceDetails(workspaceId, deviceId);
    }

    @Patch('/:deviceId')
    @UseGuards(JwtGuard)
    async updateDeviceInfo(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string, @Body() updateDeviceDto: UpdateDeviceDto): Promise<string>{
      return await this.deviceService.updateDeviceInfo(workspaceId, deviceId, updateDeviceDto);
    }

    @Get('/:deviceId/status')
    @UseGuards(JwtGuard)
    async getDeviceStatus(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string): Promise<DeviceStatus>{
      return await this.deviceService.getDeviceStatus(workspaceId, deviceId);
    }
}
