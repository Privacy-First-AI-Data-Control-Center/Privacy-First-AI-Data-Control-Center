import { Test, TestingModule } from '@nestjs/testing';
import { RetentionJobService } from './retention-job.service.js';

describe('RetentionJobService', () => {
  let service: RetentionJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetentionJobService],
    }).compile();

    service = module.get<RetentionJobService>(RetentionJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
