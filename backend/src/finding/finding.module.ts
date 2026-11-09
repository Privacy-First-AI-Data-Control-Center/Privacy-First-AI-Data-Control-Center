import { Module } from '@nestjs/common';
import { FindingService } from './finding.service.js';
import { FindingController } from './finding.controller.js';

@Module({
  controllers: [FindingController],
  providers: [FindingService],
})
export class FindingModule {}
