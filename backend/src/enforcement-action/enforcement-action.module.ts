import { Module } from '@nestjs/common';
import { EnforcementActionService } from './enforcement-action.service.js';
import { EnforcementActionController } from './enforcement-action.controller.js';
import { EnforcementAction } from './entities/enforcement-action.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyDecisionModule } from '../policy-decision/policy-decision.module.js';
import { PolicyDecision } from '../policy-decision/entities/policy-decision.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([EnforcementAction,PolicyDecision])],
  controllers: [EnforcementActionController],
  providers: [EnforcementActionService],
})
export class EnforcementActionModule {}
