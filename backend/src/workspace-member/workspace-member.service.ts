import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkspaceMembers } from './entity/workspace-members.js';
import { Repository } from 'typeorm';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto.js';

@Injectable()
export class WorkspaceMemberService {
    constructor(@InjectRepository(WorkspaceMembers) private workspaceMembersRepo: Repository<WorkspaceMembers>){}

    async addMember(createWorkspaceMemberDto: CreateWorkspaceMemberDto): Promise<string>{
        try{
            const member = await this.workspaceMembersRepo.save({
                ...createWorkspaceMemberDto,
                workspace: {id: createWorkspaceMemberDto.workspaceId},
                user: {id: createWorkspaceMemberDto.userId}
            });

            if(member != null){
                return 'Member added successfully';
            }
            else{
                return 'failed to add member';
            }
        }
        catch{
            throw new BadRequestException("Failed to add member");
        }
    }

    async getAllMembers(workspaceId: string): Promise<WorkspaceMembers[]>{
        return await this.workspaceMembersRepo.find({
            where:{
                workspace:{
                    id: parseInt(workspaceId)
                }
            },
            relations:{
                user: true
            },
            select:{
                id:true,
                role: true,
                joinedAt: true,
                user:{
                    id: true,
                    displayName: true,
                    email:true,
                    username: true
                }
            }
        });
    }

    async removeMember(workspaceId: string, memberId: string):Promise<string>{
        const res = (await this.workspaceMembersRepo.softDelete({
            workspace:{id: parseInt(workspaceId)},
            user:{id: parseInt(memberId)}
        })).affected;

        if(res != null && res>0){
            return `Member with id ${memberId} removed successfully`;
        }
        else{
            return 'Member not found';
        }
    }
}
