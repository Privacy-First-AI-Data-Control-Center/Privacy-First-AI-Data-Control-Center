import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AgentInstallations } from './entity/agent-installations.js';
import { Repository } from 'typeorm';
import { CreateAgentInstallationDto } from './dto/create-agent-installation.dto.js';

@Injectable()
export class AgentService {
    constructor(@InjectRepository(AgentInstallations) private agentInstallationRepo: Repository<AgentInstallations>){}

    async getAgentList(deviceId: string): Promise<AgentInstallations[]>{
        return this.agentInstallationRepo.find({
            where:{
                device:{
                    id: parseInt(deviceId)
                }
            }
        })
    }

    async enrollAgent(createAgentInstallationDto: CreateAgentInstallationDto): Promise<any>{
        try{
            const agentInfo = await this.agentInstallationRepo.create({
                ...createAgentInstallationDto,
                device: {id: createAgentInstallationDto.deviceId}
            });

            const agent = await this.agentInstallationRepo.save(agentInfo);
            
            if(agent != null){
                return 'Agent enrolled successfully';
            }
            else{
                return 'Failed to enroll agent';
            }
        }
        catch{
            throw new BadRequestException("Failed to add member");
        }     
    }
}
