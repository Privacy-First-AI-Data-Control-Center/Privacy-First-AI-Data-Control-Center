import { Module } from '@nestjs/common';
import { RiskFindingService } from './risk-finding.service.js';
import { RiskFindingController } from './risk-finding.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskFinding } from './entities/risk-finding.entity.js';

@Module({
  imports:[TypeOrmModule.forFeature([RiskFinding])],
  controllers: [RiskFindingController],
  providers: [RiskFindingService],
})
export class RiskFindingModule {}
