import { Controller } from '@nestjs/common';
import { FindingService } from './finding.service.js';

@Controller('workspace/:workspaceId')
export class FindingController {
  constructor(private readonly findingService: FindingService) {}
  
}
