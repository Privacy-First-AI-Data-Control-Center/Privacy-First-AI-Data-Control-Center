import { Module } from '@nestjs/common';
import { WorkspaceMemberService } from './workspace-member.service.js';
import { WorkspaceMemberController } from './workspace-member.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMembers } from './entity/workspace-members.js';

@Module({
  imports:[TypeOrmModule.forFeature([WorkspaceMembers])],
  controllers: [WorkspaceMemberController],
  providers: [WorkspaceMemberService],
})
export class WorkspaceMemberModule {}
