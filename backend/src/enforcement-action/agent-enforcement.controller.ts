import { Body, Controller, Post } from '@nestjs/common';
import { EnforcementActionService } from './enforcement-action.service.js';
import { ReportEnforcementResultDto } from './dto/report-enforcement-result.dto.js';
import { EnforcementAction } from './entities/enforcement-action.entity.js';
import { ApiResponse } from '@nestjs/swagger';

@Controller('agent/enforcement-results')
export class AgentEnforcementController {
    constructor(private readonly enforcementActionService:EnforcementActionService){}
    @Post()
    @ApiResponse({ status: 201, description: 'Enforcement result recorded successfully' })
    async reportReuslt(@Body()dto:ReportEnforcementResultDto):Promise<EnforcementAction>{
        return await this.enforcementActionService.reportResult(dto);
    }
}
