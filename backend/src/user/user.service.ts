import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entity/users.js';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { EmailService } from '../email/email.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import * as bcrypt from 'bcrypt'
import { escape } from 'querystring';

@Injectable()
export class UserService {
    constructor(@InjectRepository(Users) private userRepo: Repository<Users>, private emailService: EmailService){}

    async getProfile(id: string): Promise<Users | null>{
        return await this.userRepo.findOne({
            where:{
                id: parseInt(id)
            }
        })
    }

    async getUserById(userId: string): Promise<Users | null>{
        return await this.userRepo.findOne({
            where:[
                {username: userId},
                {email: userId}
            ]
        })
    }

    async createUser(createUserDto: CreateUserDto): Promise<string>{
        try{
            const u = await this.userRepo.save(await this.userRepo.create(createUserDto));
            if(u != null){
                return 'User registered successfully';
            }
            else{
                return 'failed to create user';
            }
        }
        catch{
            throw new BadRequestException("Failed to create user");
        }
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<string>{
        const user = await this.getProfile(id);
        if(user != null){
            const res = (await this.userRepo.update({ id: Number(id) }, updateUserDto)).affected;
            if(res != null && res > 0){
                return 'updated successfully';
            }
            else{
                return 'Failed to update';
            }
        }
        else{
            throw new NotFoundException(`User with id ${id} not found`)
        }
    }

    async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<string>{
        const user = await this.getProfile(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isMatch = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);

        if (!isMatch) {
            throw new BadRequestException('Current password is incorrect');
        }

        this.userRepo.update({id: user.id}, {passwordHash: await bcrypt.hash(changePasswordDto.newPassword, 10)});
        this.emailService.sendMail(user.email, 'Your pasword has been changed', `Your password has been changed at ${new Date().toLocaleString()}`);
        return 'Password changed successfully';
    }

    async deleteUser(id: string): Promise<string>{
        const res = (await this.userRepo.softDelete(id)).affected;
        if(res != null && res > 0){
            return `User with id: ${id} deleted successfully`;
        }
        else{
            return `User not found`;
        }
    }
}
