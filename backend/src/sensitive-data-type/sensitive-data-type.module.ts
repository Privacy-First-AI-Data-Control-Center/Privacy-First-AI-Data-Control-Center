import { Module } from '@nestjs/common';
import { SensitiveDataTypeService } from './sensitive-data-type.service.js';
import { SensitiveDataTypeController } from './sensitive-data-type.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensitiveDataType } from './entity/SensitiveDataType.js';

@Module({
  imports:[TypeOrmModule.forFeature([SensitiveDataType])],
  controllers: [SensitiveDataTypeController],
  providers: [SensitiveDataTypeService],
})
export class SensitiveDataTypeModule {}
