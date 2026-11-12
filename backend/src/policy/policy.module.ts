import { Module } from '@nestjs/common';
import { PolicyService } from './policy.service.js';
import { PolicyController } from './policy.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policies } from './entities/policy.entity.js';
import { PolicyVersions } from './entities/policy-version.entity.js';
import { PolicyRules } from './entities/policy-rule.entity.js';

@Module({
  imports:[TypeOrmModule.forFeature([Policies,PolicyVersions,PolicyRules])],
  controllers: [PolicyController],
  providers: [PolicyService],
})
export class PolicyModule {}
