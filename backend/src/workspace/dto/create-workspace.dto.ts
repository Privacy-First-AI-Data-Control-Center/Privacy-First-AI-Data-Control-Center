import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";
import { WorkspaceStatus } from "../enum/workspace-status.js";
import { WorkspaceType } from "../enum/workspace-type.js";

export class CreateWorkspaceDto{
    @IsString()
    @IsNotEmpty()
    name: string;
    @IsOptional()
    @IsEnum(WorkspaceType)
    workspaceType: WorkspaceType;
    @IsOptional()
    @IsEnum(WorkspaceStatus)
    workspaceStatus: WorkspaceStatus;
    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Min(1)
    ownerUserId: number;
}