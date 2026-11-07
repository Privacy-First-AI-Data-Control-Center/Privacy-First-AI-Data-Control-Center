import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspaces } from './entity/workspaces.js';
import { Repository } from 'typeorm';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { Users } from '../user/entity/users.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.sto.js';

@Injectable()
export class WorkspaceService {
    constructor(@InjectRepository(Workspaces) private workspaceRepo: Repository<Workspaces>){}

    async createWorkspace(createWorkspaceDto: CreateWorkspaceDto): Promise<string>{
        try{
            const workspace = await this.workspaceRepo.save({
                ...createWorkspaceDto,
                ownerUser: {id: createWorkspaceDto.ownerUserId} as Users
            });
            if(workspace != null){
                return 'Workspace created successfully';
            }
            else{
                return 'failed to create workspace';
            }
        }
        catch{
            throw new BadRequestException("Failed to create workspace");
        }
    }

    async getAllWorkspaces(): Promise<Workspaces[]>{
        return await this.workspaceRepo.find();
    }

    async getWorkspaceById(id: string): Promise<Workspaces | null>{
        return await this.workspaceRepo.findOne({
            where:{
                id: parseInt(id)
            }
        });
    }

    async deleteWorkspace(id: string): Promise<string>{
        const res = (await this.workspaceRepo.softDelete(id)).affected;
        if(res != null && res>0){
            return `Workspace with id ${id} deleted successfully`;
        }
        else{
            return 'Workspace not found';
        }
    }

    async updateWorkspace(id: string, updateWorkspaceDto: UpdateWorkspaceDto): Promise<string>{
        const workspace = await this.getWorkspaceById(id);
        if(workspace != null){
            const res = (await this.workspaceRepo.update({id: Number(id)}, updateWorkspaceDto)).affected;
            if(res != null && res > 0){
                return 'updated successfully';
            }
            else{
                return 'Failed to update';
            }
        }
        else{
            throw new NotFoundException(`Workspace with id ${id} not found`);
        }
    }
}
