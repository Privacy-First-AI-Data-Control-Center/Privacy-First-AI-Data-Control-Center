import { Test, TestingModule } from '@nestjs/testing';
import { DeletionJobServiceService } from './deletion-job.service.service.js';

describe('DeletionJobServiceService', () => {
  let service: DeletionJobServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeletionJobServiceService],
    }).compile();

    service = module.get<DeletionJobServiceService>(DeletionJobServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
