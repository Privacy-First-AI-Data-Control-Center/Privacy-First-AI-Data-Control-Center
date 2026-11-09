import { Controller, Get, Param } from '@nestjs/common';
import { SensitiveDataTypeService } from './sensitive-data-type.service.js';
import { SensitiveDataTypeDto } from './dto/create-sensitivedatatype.dto.js';
import { SensitiveDataType } from './entity/SensitiveDataType.js';

@Controller('sensitive-data-type')
export class SensitiveDataTypeController {
  constructor(private readonly sensitiveDataTypeService: SensitiveDataTypeService) {}
  @Get()
  async FindAll():Promise<SensitiveDataType[] | null>{
    return await this.sensitiveDataTypeService.FindAll();
  }
  @Get('/:typeId')
  async getSensitiveDataTypeById(@Param('typeId')typeId:string):Promise<SensitiveDataType|null>{
    return await this.sensitiveDataTypeService.getSensitiveDataTypeById(typeId);
  }
}
