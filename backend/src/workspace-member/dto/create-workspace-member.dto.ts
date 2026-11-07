import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from "class-validator";
import { Role } from "../../user/enum/role.js";

export class CreateWorkspaceMemberDto{
    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Min(1)
    workspaceId: number;
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @Min(1)
    userId: number;
    @IsNotEmpty()
    @IsEnum(Role)
    role: Role;
}