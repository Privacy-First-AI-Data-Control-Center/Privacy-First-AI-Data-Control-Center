import { Test, TestingModule } from '@nestjs/testing';
import { ExportJobService } from './export-job.service.js';

describe('ExportJobService', () => {
  let service: ExportJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportJobService],
    }).compile();

    service = module.get<ExportJobService>(ExportJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
