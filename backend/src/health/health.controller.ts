import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async health(){
    return await this.healthService.health();
  }

  @Get('/live')
  live(){
    return this.healthService.live();
  }

  @Get('/ready')
  async ready(){
    return await this.healthService.ready();
  }
}