import { BadRequestException, Injectable } from '@nestjs/common';
import { SensitiveDataType } from './entity/SensitiveDataType.js';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SensitiveDataTypeService {
    constructor(@InjectRepository(SensitiveDataType) private sensitiveDataTypeRepo: Repository<SensitiveDataType>){}
    async FindAll():Promise<SensitiveDataType[] | null>{
        try{
            return await this.sensitiveDataTypeRepo.find();
        }
        catch{
            throw new BadRequestException('Sensitive Data Type Can not be Found');
        }
    }
    async getSensitiveDataTypeById(typeId:string):Promise<SensitiveDataType|null>{
        try{
            return await this.sensitiveDataTypeRepo.findOne({
                where:[
                    {id:typeId},
                ]
            })
        }
        catch{
            throw new BadRequestException('Sensitive Data Type Can not be Found');
        }
    }
}
