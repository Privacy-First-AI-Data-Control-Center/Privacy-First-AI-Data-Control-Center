import { Module } from '@nestjs/common';
import { ConnectorsService } from './connectors.service.js';
import { ConnectorsController } from './connectors.controller.js';

@Module({
  controllers: [ConnectorsController],
  providers: [ConnectorsService],
})
export class ConnectorsModule {}
