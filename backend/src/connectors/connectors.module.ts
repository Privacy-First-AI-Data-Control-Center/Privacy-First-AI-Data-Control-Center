import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectorsService } from './connectors.service.js';
import { ConnectorsController } from './connectors.controller.js';
import { ConnectorTypes } from './entities/connector.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ConnectorTypes])],
  controllers: [ConnectorsController],
  providers: [ConnectorsService],
  exports: [ConnectorsService, TypeOrmModule],
})
export class ConnectorsModule {}
