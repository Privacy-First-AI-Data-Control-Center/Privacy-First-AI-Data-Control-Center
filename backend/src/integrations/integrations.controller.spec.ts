import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsController } from './integrations.controller.js';
import { IntegrationsService } from './integrations.service.js';

describe('IntegrationsController', () => {
  let controller: IntegrationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationsController],
      providers: [IntegrationsService],
    }).compile();

    controller = module.get<IntegrationsController>(IntegrationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
