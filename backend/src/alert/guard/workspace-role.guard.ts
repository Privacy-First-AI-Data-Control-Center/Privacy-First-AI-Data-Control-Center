import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Workspaces } from "../../workspace/entity/workspaces.js";
import { WorkspaceMembers } from "../../workspace-member/entity/workspace-members.js";
import { Role } from "../../user/enum/role.js";
import { WORKSPACE_ROLES_KEY } from "./workspace-roles.decorator.js";

@Injectable()
export class WorkspaceRoleGuard implements CanActivate{
    constructor(
        private readonly reflector: Reflector,
        @InjectRepository(Workspaces) private workspaceRepo: Repository<Workspaces>,
        @InjectRepository(WorkspaceMembers) private memberRepo: Repository<WorkspaceMembers>
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean>{
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(WORKSPACE_ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        const req = context.switchToHttp().getRequest();
        const user = req.user;
        const workspaceId = parseInt(req.params.workspaceId);

        if(isNaN(workspaceId)){
            throw new BadRequestException('Invalid workspace id');
        }

        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
            relations: { ownerUser: true }
        });
       
        if(!workspace){
            throw new NotFoundException(`Workspace with id ${workspaceId} not found`);
        }

        
        let role: Role | null = null;
        if(workspace.ownerUser?.id === user.id){
            role = Role.OWNER;
        }
        else{
            const member = await this.memberRepo.findOne({
                where: {
                    workspace: { id: workspaceId },
                    user: { id: user.id }
                }
            });
            role = member?.role ?? null;
        }

        if(role === null){
            throw new NotFoundException(`Workspace with id ${workspaceId} not found`);
        }

      
        req.workspaceRole = role;

        if(requiredRoles && !requiredRoles.includes(role)){
            throw new ForbiddenException('You do not have permission for this action');
        }
        return true;
    }
}