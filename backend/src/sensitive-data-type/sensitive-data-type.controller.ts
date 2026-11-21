import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SensitiveDataTypeService } from './sensitive-data-type.service.js';
import { SensitiveDataTypeDto } from './dto/create-sensitivedatatype.dto.js';
import { SensitiveDataType } from './entity/SensitiveDataType.js';
import { JwtGuard } from '../auth/jwtGuard.guard.js';

@ApiTags('Sensitive Data Types')
@Controller('sensitive-data-type')
export class SensitiveDataTypeController {
  constructor(private readonly sensitiveDataTypeService: SensitiveDataTypeService) {}

  @ApiOperation({ summary: 'List detectable sensitive-data categories' })
  @Get()
  @UseGuards(JwtGuard)
  async FindAll():Promise<SensitiveDataType[] | null>{
    return await this.sensitiveDataTypeService.FindAll();
  }

  @ApiOperation({ summary: 'View details of a sensitive-data category' })
  @Get('/:typeId')
  @UseGuards(JwtGuard)
  async getSensitiveDataTypeById(@Param('typeId')typeId:string):Promise<SensitiveDataType|null>{
    return await this.sensitiveDataTypeService.getSensitiveDataTypeById(typeId);
  }
}
