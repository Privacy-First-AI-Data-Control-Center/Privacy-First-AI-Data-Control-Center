 import { Module } from '@nestjs/common';                                                                                                                                               
    import { TypeOrmModule } from '@nestjs/typeorm';                                                                                                                                       
    import { ReportsService } from './reports.service.js';
    import { ReportsController } from './reports.controller.js';
    import { Reports } from './entities/report.entity.js';
    import { ReportRuns } from './entities/report-run.entity.js';
    import { Workspaces } from '../workspace/entity/workspaces.js';
    import { Events } from '../events/entities/event.entity.js';
    import { Findings } from '../finding/entities/finding.entity.js';
    import { RiskFinding } from '../risk-finding/entities/risk-finding.entity.js';
    import { PolicyDecision } from '../policy-decision/entities/policy-decision.entity.js';
    import { EnforcementAction } from '../enforcement-action/entities/enforcement-action.entity.js';
    import { Alerts } from '../alert/entities/alerts.entity.js';
    import { Integrations } from '../integrations/entities/integration.entity.js';
import { ReportJobService } from './report-job.service.js';
  
    @Module({
      imports: [
        TypeOrmModule.forFeature([
          Reports,
          ReportRuns,
          Workspaces,
          Events,
          Findings,
          RiskFinding,
          PolicyDecision,
          EnforcementAction,
          Alerts,
          Integrations,
        ]),
      ],
      controllers: [ReportsController],
      providers: [ReportsService,ReportJobService],
      exports: [ReportsService, TypeOrmModule],
    })
    export class ReportsModule {}
