import { Module } from '@nestjs/common';
import { DeviceService } from './device.service.js';
import { DeviceController } from './device.controller.js';
import { Devices } from './entity/devices.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentModule } from '../agent/agent.module.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Devices]), AgentModule, WorkspaceModule],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
