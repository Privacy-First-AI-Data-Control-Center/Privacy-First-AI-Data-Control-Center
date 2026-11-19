 import {
      BadRequestException,
      Injectable,
      NotFoundException,
      StreamableFile,
    } from '@nestjs/common';
    import { InjectRepository } from '@nestjs/typeorm';
    import { Repository } from 'typeorm';
    import { createReadStream, existsSync } from 'fs';
    import { Reports, type ReportDefinition } from './entities/report.entity.js';
    import { ReportRuns } from './entities/report-run.entity.js';
    import { Workspaces } from '../workspace/entity/workspaces.js';
    import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
    import { CreateReportDto } from './dto/create-report.dto.js';
    import { UpdateReportDto } from './dto/update-report.dto.js';
    import { ReportType } from './enum/report-type.enum.js';
    import { ReportFormat } from './enum/report-format.enum.js';
    import { ReportRunStatus } from './enum/report-run-status.enum.js';
  
    @Injectable()
    export class ReportsService {
      constructor(
        @InjectRepository(Reports)
        private readonly reportRepo: Repository<Reports>,
        @InjectRepository(ReportRuns)
        private readonly runRepo: Repository<ReportRuns>,
        @InjectRepository(Workspaces)
        private readonly workspaceRepo: Repository<Workspaces>,
        private readonly auditLogsService: AuditLogsService,
      ) {}
  
      private validateDateRange(from?: string, to?: string): void {
        if (from && to && new Date(from) > new Date(to)) {
          throw new BadRequestException('"from" date must be before "to" date');
        }
      }                                                                                                                                                                                    
  
      async create(workspaceId: number, dto: CreateReportDto, userId: number): Promise<Reports> {
        const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
        if (!workspace) {
          throw new NotFoundException(`Workspace #${workspaceId} not found`);
        }
  
        this.validateDateRange(dto.definition.from, dto.definition.to);
  
        const definition: ReportDefinition = {
          reportType: dto.definition.reportType ?? ReportType.EXECUTIVE_SUMMARY,
          format: dto.definition.format ?? ReportFormat.JSON,
          from: dto.definition.from,
          to: dto.definition.to,
          sections : dto.definition.sections,
        };
  
        const report = this.reportRepo.create({
          workspaceId,
          createdBy: userId,
          title: dto.title,
          definition,
        });
  
        const saved = await this.reportRepo.save(report);
  
        await this.auditLogsService.log({
          workspaceId,
          actorUserId: userId,
          action: 'REPORT_CREATED',
          targetType: 'REPORT',
          targetId: saved.id,
          metadata: { title: saved.title, definition: saved.definition },
        });
  
        return saved;
      }
  
      async findAll(workspaceId: number): Promise<Reports[]> {
        return this.reportRepo.find({
          where: { workspaceId },
          order: { createdAt: 'DESC' },
        });
      }
  
      async findOne(workspaceId: number, reportId: number): Promise<Reports> {
        const report = await this.reportRepo.findOne({ 
          where: { id: reportId, workspaceId },
          relations: { runs: true },
          order: { runs: { createdAt: 'DESC' } },
        }); 
  
        if (!report) {
          throw new NotFoundException(`Report #${reportId} not found in workspace #${workspaceId}`);
        } 
  
        return report;
      } 
  
      async update(
        workspaceId: number,
        reportId: number,
        dto: UpdateReportDto,
        userId: number, 
      ): Promise<Reports> { 
        const report = await this.findOne(workspaceId, reportId);
  
        if (dto.title !== undefined) {
          report.title = dto.title; 
        }
  
        if (dto.definition !== undefined) {
          const mergedDefinition: ReportDefinition = { 
            ...report.definition,
            ...dto.definition,
          };
          this.validateDateRange(mergedDefinition.from, mergedDefinition.to);
          report.definition = mergedDefinition;
        } 
  
        const updated = await this.reportRepo.save(report);
  
        await this.auditLogsService.log({ 
          workspaceId,
          actorUserId: userId,
          action: 'REPORT_UPDATED',
          targetType: 'REPORT',
          targetId: updated.id, 
          metadata: { title: updated.title, definition: updated.definition },
        }); 
  
        return updated;
      } 
  
      async remove(workspaceId: number, reportId: number, userId: number) { 
        const report = await this.findOne(workspaceId, reportId);
        await this.reportRepo.softDelete(report.id);
  
        await this.auditLogsService.log({
          workspaceId, 
          actorUserId: userId,
          action: 'REPORT_DELETED',
          targetType: 'REPORT',
          targetId: report.id,
        });
  
        return { deleted: true, reportId: report.id };
      } 
  
      async triggerRun(workspaceId: number, reportId: number, userId: number): Promise<ReportRuns> { 
        const report = await this.findOne(workspaceId, reportId);
  
        const run = this.runRepo.create({
          reportId: report.id,
          requestedBy: userId, 
          status: ReportRunStatus.PENDING,
        }); 
  
        const saved = await this.runRepo.save(run); 
  
        await this.auditLogsService.log({
          workspaceId, 
          actorUserId: userId, 
          action: 'REPORT_RUN_REQUESTED',
          targetType: 'REPORT_RUN',
          targetId: saved.id, 
          metadata: { reportId: report.id, reportType: report.definition.reportType }, 
        });
  
        return saved;
      }
  
      async findRuns(workspaceId: number, reportId: number): Promise<ReportRuns[]> {
        await this.findOne(workspaceId, reportId);
        return this.runRepo.find({ 
          where: { reportId },
          order: { createdAt: 'DESC' },
        }); 
      }
  
      async findOneRun(workspaceId: number, reportId: number, runId: number): Promise<ReportRuns> {
        await this.findOne(workspaceId, reportId);
  
        const run = await this.runRepo.findOne({ 
          where: { id: runId, reportId },
        }); 
  
        if (!run) {
          throw new NotFoundException(`Report run #${runId} not found for report #${reportId}`); 
        }
  
        return run; 
      }
  
      async downloadRun( 
        workspaceId: number,
        reportId: number, 
        runId: number,
        userId: number,
      ): Promise<StreamableFile> { 
        const report = await this.findOne(workspaceId, reportId); 
        const run = await this.findOneRun(workspaceId, reportId, runId);
  
        if (run.status !== ReportRunStatus.COMPLETED) {
          throw new BadRequestException(`Report run is ${run.status}, not ready for download`); 
        }
  
        if (!run.resultReference || !existsSync(run.resultReference)) { 
          throw new NotFoundException('Generated report file not found on disk');
        }
  
        await this.auditLogsService.log({
          workspaceId, 
          actorUserId: userId,
          action: 'REPORT_RUN_DOWNLOADED',
          targetType: 'REPORT_RUN',
          targetId: run.id, 
          metadata: { reportId: report.id },
        });
  
        const isCsv = report.definition.format === ReportFormat.CSV;
        const fileName = `report-${report.id}-run-${run.id}.${isCsv ? 'csv' : 'json'}`;
  
        return new StreamableFile(createReadStream(run.resultReference), {
          type: isCsv ? 'text/csv' : 'application/json',
          disposition: `attachment; filename="${fileName}"`, 
        });
      } 
    }