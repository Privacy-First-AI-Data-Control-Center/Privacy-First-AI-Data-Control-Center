import { Module } from '@nestjs/common';
import { DeviceService } from './device.service.js';
import { DeviceController } from './device.controller.js';
import { Devices } from './entity/devices.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Devices])],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
