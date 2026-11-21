import { Body, Controller, Post } from '@nestjs/common';
import { EnforcementActionService } from './enforcement-action.service.js';
import { ReportEnforcementResultDto } from './dto/report-enforcement-result.dto.js';
import { EnforcementAction } from './entities/enforcement-action.entity.js';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Agent Enforcement')
@Controller('agent/enforcement-results')
export class AgentEnforcementController {
    constructor(private readonly enforcementActionService:EnforcementActionService){}

    @ApiOperation({ summary: 'Report whether an enforcement action succeeded' })
    @Post()
    @ApiResponse({ status: 201, description: 'Enforcement result recorded successfully' })
    async reportReuslt(@Body()dto:ReportEnforcementResultDto):Promise<EnforcementAction>{
        return await this.enforcementActionService.reportResult(dto);
    }
}
