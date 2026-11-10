import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Findings } from './entities/finding.entity.js';
import { Repository } from 'typeorm';
import { Severity } from '../sensitive-data-type/enum/Severity.js';
import { UpdateFindingDto } from './dto/update-finding.dto.js';
import { UpdateFindingStatusDto } from './dto/update-status-finding.dto.js';

@Injectable()
export class FindingService {
    constructor(@InjectRepository(Findings) private findingsRepo: Repository<Findings>,){}

    async findAll(workspaceId:number):Promise<Findings[]>{
        try{
            const f = await this.findingsRepo.find({
                where:{event:{workspace:{id:workspaceId}}},
                relations:{sensetiveDataType:true},
                order:{deletedAt:'DESC'},
            });
            if(!f){
                throw new NotFoundException('No Findings Found')
            }
            return f;
        }
        catch{
            throw new BadRequestException();
        }
    }
    async findOne(workspaceId:number,findingId:string):Promise<Findings>{
        try{
            const f = await this.findingsRepo.findOne({
                where:{id:findingId,
                    event:{workspace:{id:workspaceId}}
                },
                relations:{sensetiveDataType:true},
            });
            if(!f){
                throw new NotFoundException('No Finding Found');
            }
            return f;
        }
        catch{
            throw new BadRequestException();
        }   
    }
    async statistics(workspaceId:number):Promise<{total:number;byStatus:Record<string,number>;bySeverity:Record<string,number>;}>{
        try{
            const findings=await this.findAll(workspaceId);
            const byStatus:Record<string,number> = {};
            const bySeverity:Record<string,number>= {};
            for (const finding of findings){
                const status = finding.status;
                const severity = finding.sensetiveDataType.severity;
                byStatus[status]+=1;
                bySeverity[severity]+=1;
            }
            return {total:findings.length,byStatus,bySeverity}
        }
        catch{
            throw new BadRequestException();
        }
    }
    async updateStatus(workspaceId:number,findingId:string,dto:UpdateFindingStatusDto):Promise<Findings>{
        try{
            const f = await this.findOne(workspaceId,findingId);
            f.status = dto.status;
            return this.findingsRepo.save(f);
        }
        catch{
            throw new BadRequestException();
        }
    }


}
