import { Controller } from '@nestjs/common';
import { FindingService } from './finding.service.js';

@Controller('finding')
export class FindingController {
  constructor(private readonly findingService: FindingService) {}
}
