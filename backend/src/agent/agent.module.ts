import { Module } from '@nestjs/common';
import { AgentService } from './agent.service.js';
import { AgentController } from './agent.controller.js';
import { AgentInstallations } from './entity/agent-installations.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AgentInstallations])],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
