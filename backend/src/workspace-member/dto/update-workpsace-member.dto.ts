import { PartialType } from "@nestjs/mapped-types";
import { CreateWorkspaceMemberDto } from "./create-workspace-member.dto.js";

export class UpdateWorkspaceMemberDto extends PartialType(CreateWorkspaceMemberDto){}