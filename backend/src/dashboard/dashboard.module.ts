import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { DashboardController } from './dashboard.controller.js';
import { WorkspaceMembers } from '../workspace-member/entity/workspace-members.js';
import { Workspaces } from '../workspace/entity/workspaces.js';
import { Integrations } from '../integrations/entities/integration.entity.js';
import { PolicyDecision } from '../policy-decision/entities/policy-decision.entity.js';
import { RiskFinding } from '../risk-finding/entities/risk-finding.entity.js';
import { Findings } from '../finding/entities/finding.entity.js';
import { Alerts } from '../alert/entities/alerts.entity.js';
import { Events } from '../events/entities/event.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Events, Alerts, Findings, RiskFinding, PolicyDecision, Integrations, Workspaces, WorkspaceMembers])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
