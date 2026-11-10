import { Module } from '@nestjs/common';
import { FindingService } from './finding.service.js';
import { FindingController } from './finding.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Findings } from './entities/finding.entity.js';

@Module({
  imports:[TypeOrmModule.forFeature([Findings])],
  controllers: [FindingController],
  providers: [FindingService],
})
export class FindingModule {}
