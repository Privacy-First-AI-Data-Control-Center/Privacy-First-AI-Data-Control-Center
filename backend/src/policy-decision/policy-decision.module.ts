import { Module } from '@nestjs/common';
import { PolicyDecisionService } from './policy-decision.service.js';
import { PolicyDecisionController } from './policy-decision.controller.js';
import { PolicyDecision } from './entities/policy-decision.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([PolicyDecision])],
  controllers: [PolicyDecisionController],
  providers: [PolicyDecisionService],
})
export class PolicyDecisionModule {}
