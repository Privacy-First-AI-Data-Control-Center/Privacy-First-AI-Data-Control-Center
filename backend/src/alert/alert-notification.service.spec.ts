import { Test, TestingModule } from '@nestjs/testing';
import { AlertNotificationService } from './alert-notification.service.js';

describe('AlertNotificationService', () => {
  let service: AlertNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertNotificationService],
    }).compile();

    service = module.get<AlertNotificationService>(AlertNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
