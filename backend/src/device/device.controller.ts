import {Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeviceService } from './device.service.js';
import { CreateDeviceDto } from './dto/create-device.dto.js';
import { Devices } from './entity/devices.js';
import { UpdateDeviceDto } from './dto/update-device.dto.js';
import { DeviceStatus } from './enum/device-status.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';
import { RolesGuard } from '../auth/roles/roles.guard.js';
import { Roles } from '../auth/roles/roles.decorator.js';
import { Role } from '../user/enum/role.js';
import { AgentInstallations } from '../agent/entity/agent-installations.js';

@ApiTags('Workspace Devices (Member 1)')
@Controller(['workspaces/:workspaceId/devices', 'workspaces/:workspaceId/device'])
@UseGuards(JwtGuard, RolesGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

    @ApiOperation({ summary: 'Start enrolling a device in the workspace' })
    @Post('enroll')
    @Roles(Role.OWNER, Role.ADMIN)
    async enrollDevice(@Param('workspaceId') workspaceId: string, @Body() createDeviceDto: CreateDeviceDto): Promise<string>{
      createDeviceDto.workspaceId = parseInt(workspaceId);
      return await this.deviceService.enrollDevice(createDeviceDto);
    }

    @ApiOperation({ summary: 'List enrolled devices in the workspace' })
    @Get()
    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    async getAllDevices(@Param('workspaceId') workspaceId: string): Promise<Devices[]>{
      return await this.deviceService.getAllDevices(workspaceId);
    }

    @ApiOperation({ summary: "View an enrolled device's details" })
    @Get('/:deviceId')
    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    async getDeviceDetails(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string): Promise<Devices>{
      return await this.deviceService.getDeviceDetails(workspaceId, deviceId);
    }

    @ApiOperation({ summary: 'Change device name or device settings' })
    @Patch('/:deviceId')
    @Roles(Role.OWNER, Role.ADMIN)
    async updateDeviceInfo(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string, @Body() updateDeviceDto: UpdateDeviceDto): Promise<string>{
      return await this.deviceService.updateDeviceInfo(workspaceId, deviceId, updateDeviceDto);
    }

    @ApiOperation({ summary: 'Revoke a device agent credentials' })
    @ApiResponse({ status: 200, description: 'Device credentials revoked successfully' })
    @ApiResponse({ status: 404, description: 'Device not found in workspace' })
    @Post('/:deviceId/revoke')
    @Roles(Role.OWNER, Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async revokeDevice(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string): Promise<string> {
      return await this.deviceService.revokeDevice(workspaceId, deviceId);
    }

    @ApiOperation({ summary: 'View device and monitoring-agent status' })
    @Get('/:deviceId/status')
    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    async getDeviceStatus(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string): Promise<DeviceStatus>{
      return await this.deviceService.getDeviceStatus(workspaceId, deviceId);
    }

    @ApiOperation({ summary: 'List software-agent installations for a device' })
    @Get('/:deviceId/installations')
    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    async getAgentList(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string): Promise<AgentInstallations[]>{
        return this.deviceService.getAgentList(workspaceId, deviceId);
    }
}
