import { ActorType } from "../enum/actor-type.js";


export class CreateAuditLogDto
{
    workspaceId: number;
    actorUserId?: number | null;
    actorType?: ActorType;
    action: string;
    targetType: string;
    targetId?: string | number | null;
    metadata?: any;
    requestId?: string | null;
    
}