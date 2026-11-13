import { Module } from '@nestjs/common';
import { RiskRuleService } from './risk-rule.service.js';
import { RiskRuleController } from './risk-rule.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskRule } from './entities/risk-rule.entity.js';

@Module({
  imports:[TypeOrmModule.forFeature([RiskRule])],
  controllers: [RiskRuleController],
  providers: [RiskRuleService],
})
export class RiskRuleModule {}
