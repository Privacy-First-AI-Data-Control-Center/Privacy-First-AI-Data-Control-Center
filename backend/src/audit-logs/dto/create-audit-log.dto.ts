import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import { ActorType } from "../enum/actor-type.js";

export class CreateAuditLogDto
{
    @IsNotEmpty()
    @IsInt()
    workspaceId: number;

    @IsOptional()
    @IsInt()
    actorUserId?: number | null;

    @IsOptional()
    @IsEnum(ActorType)
    actorType?: ActorType;

    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    action: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    targetType: string;

    @IsOptional()
    targetId?: string | number | null;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

    @IsOptional()
    @IsString()
    requestId?: string | null;
}