import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkspaceMembers } from './entity/workspace-members.js';
import { Repository } from 'typeorm';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto.js';
import { EmailService } from '../email/email.service.js';
import { UserService } from '../user/user.service.js';

@Injectable()
export class WorkspaceMemberService {
    constructor(@InjectRepository(WorkspaceMembers) private workspaceMembersRepo: Repository<WorkspaceMembers>, private emailService: EmailService){}

    async addMember(createWorkspaceMemberDto: CreateWorkspaceMemberDto): Promise<string>{
        try{
            const memberinfo = await this.workspaceMembersRepo.create({
                ...createWorkspaceMemberDto,
                workspace: {id: createWorkspaceMemberDto.workspaceId},
                user: {id: createWorkspaceMemberDto.userId}
            });

            const member = await this.workspaceMembersRepo.save(memberinfo);

            if(member != null){
                this.sendInvitaionMail(member.id);
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

    // async updateMemberRole(workspaceId: string, memberId: string, updateDeviceDto: UpdateDeviceDto){
    //     const device = await this.getDeviceDetails(workspaceId, deviceId);
    //     if(device != null){
    //         const res = (await this.deviceRepo.update({ id: Number(deviceId) }, updateDeviceDto)).affected;
    //         if(res != null && res > 0){
    //             return 'updated successfully';
    //         }
    //         else{
    //             return 'Failed to update';
    //         }
    //     }
    //     else{
    //         throw new NotFoundException(`Device with id ${id} not found`)
    //     }    
    // }

    async sendInvitaionMail(id: number){
        const data = await this.workspaceMembersRepo
        .createQueryBuilder('wm')
        .innerJoin('wm.workspace', 'w')
        .innerJoin('w.ownerUser', 'wu')
        .innerJoin('wm.user', 'u')
        .select([
            'wm.id AS id',
            'u.displayName AS member_name',
            'u.email AS member_email',
            'w.name AS workspace_name',
            'wu.displayName AS owner'
        ])
        .where('wm.id = :id', { id })
        .getRawOne();
        this.emailService.sendMail(data.member_email, "Workspace Invitation", `Dear ${data.member_name}, ${data.owner} has added you to workspace: ${data.workspace_name}`);
    }
}
