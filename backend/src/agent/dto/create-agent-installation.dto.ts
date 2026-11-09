import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateAgentInstallationDto{
    @IsInt()
    @IsNotEmpty()
    deviceId: number;

    @IsString()
    @IsNotEmpty()
    installationId: string;

    @IsString()
    @IsNotEmpty()
    agentVersion: string;
}